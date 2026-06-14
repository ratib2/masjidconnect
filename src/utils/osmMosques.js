// src/utils/osmMosques.js
// Recupera moschee da OpenStreetMap tramite Overpass API
// Completamente gratuito, nessuna chiave API necessaria
// Dati aggiornati dalla comunità globale di OpenStreetMap

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Server alternativi in caso di sovraccarico
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

/**
 * Cerca moschee vicino a una posizione geografica
 * @param {number} lat - Latitudine
 * @param {number} lng - Longitudine  
 * @param {number} radiusKm - Raggio di ricerca in km (default 10)
 * @returns {Array} Lista di moschee formattate
 */
export async function fetchMosquesFromOSM(lat, lng, radiusKm = 10) {
  const radiusM = radiusKm * 1000;

  // Query Overpass per trovare moschee (amenity=place_of_worship + religion=muslim)
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
      relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
    );
    out center tags;
  `;

  let lastError = null;
  for (const url of OVERPASS_MIRRORS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return formatOSMResults(data.elements, lat, lng);
    } catch (err) {
      lastError = err;
      console.warn(`Overpass mirror failed (${url}):`, err.message);
      continue;
    }
  }

  console.error('All Overpass mirrors failed:', lastError?.message);
  return [];
}

/**
 * Cerca moschee per nome di città (geocode + ricerca)
 * @param {string} cityName - Nome della città
 * @param {string} country - Paese (opzionale)
 * @returns {Array} Lista di moschee
 */
export async function fetchMosquesByCity(cityName, country = '') {
  // Prima geocodifica la città
  const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName + (country ? ', ' + country : ''))}&format=json&limit=1`;

  try {
    const geoResponse = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'MasjidConnect/1.0' },
    });
    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) return [];

    const { lat, lon } = geoData[0];
    // Usa raggio più grande per ricerca per città (25km)
    return fetchMosquesFromOSM(parseFloat(lat), parseFloat(lon), 25);
  } catch (err) {
    console.error('fetchMosquesByCity error:', err.message);
    return [];
  }
}

/**
 * Formatta i risultati OSM nel formato usato dall'app
 */
function formatOSMResults(elements, userLat, userLng) {
  if (!elements) return [];

  return elements
    .map((el) => {
      const tags = el.tags || {};
      // Coordinate: node ha lat/lon, way/relation ha center
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;

      if (!lat || !lng) return null;

      const name = tags.name ||
        tags['name:it'] ||
        tags['name:en'] ||
        tags['name:ar'] ||
        'Moschea';

      const address = buildAddress(tags);
      const city = tags['addr:city'] || tags['addr:town'] || '';
      const country = tags['addr:country'] || '';
      const phone = tags.phone || tags['contact:phone'] || '';
      const website = tags.website || tags['contact:website'] || '';

      const distance = userLat && userLng
        ? haversineKm(userLat, userLng, lat, lng)
        : null;

      return {
        id: `osm_${el.type}_${el.id}`,
        osmId: el.id,
        osmType: el.type,
        name,
        address,
        city,
        country,
        phone,
        website,
        lat,
        lng,
        distance: distance ? Math.round(distance * 10) / 10 : null,
        // OSM non ha orari Iqama — l'utente li aggiunge
        prayerTimes: null,
        iqamaTimes: null,
        // Flag per distinguere moschee OSM da quelle Firestore
        source: 'osm',
        womenSection: tags.female === 'yes' || tags['prayer:women'] === 'yes',
        capacity: tags.capacity ? parseInt(tags.capacity) : null,
        openingHours: tags.opening_hours || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
}

function buildAddress(tags) {
  const parts = [];
  if (tags['addr:street']) {
    parts.push(tags['addr:street'] + (tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''));
  }
  if (tags['addr:city'] || tags['addr:town']) {
    parts.push(tags['addr:city'] || tags['addr:town']);
  }
  return parts.join(', ') || tags['addr:full'] || '';
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Salva una moschea OSM su Firestore dopo che l'utente aggiunge gli orari
 * Converte il formato OSM nel formato Firestore dell'app
 */
export function osmMosqueToFirestore(osmMosque, prayerTimes, iqamaTimes, contactInfo) {
  return {
    name: osmMosque.name,
    address: osmMosque.address,
    city: osmMosque.city,
    country: osmMosque.country,
    lat: osmMosque.lat,
    lng: osmMosque.lng,
    phone: osmMosque.phone,
    website: osmMosque.website,
    womenSection: osmMosque.womenSection,
    capacity: osmMosque.capacity,
    prayerTimes: prayerTimes || null,
    iqamaTimes: iqamaTimes || null,
    osmId: osmMosque.osmId,
    osmType: osmMosque.osmType,
    source: 'osm_verified',
    contact: contactInfo || null,
    status: 'pending', // va approvata dall'admin
  };
}
