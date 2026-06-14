// src/utils/geoFilter.js
// Filtro geografico intelligente:
// - Rileva automaticamente paese e regione dell'utente
// - Mostra prima le moschee nel raggio immediato
// - Espande gradualmente se non ne trova abbastanza
// - Si aggiorna automaticamente se l'utente si sposta in un altro paese

import * as Location from 'expo-location';

// Raggio iniziale di ricerca in km
const RADIUS_STEPS = [10, 25, 50, 100, 500, 99999];
const MIN_RESULTS = 3; // espandi finché non trovi almeno questo numero

/**
 * Calcola la distanza in km tra due coordinate (Haversine)
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
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
 * Ottieni il contesto geografico dall'utente:
 * paese, regione/stato, città
 */
export async function getUserGeoContext(lat, lng) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!results || results.length === 0) return null;
    const place = results[0];
    return {
      country: place.country || null,
      countryCode: place.isoCountryCode || null,
      region: place.region || place.subregion || null,
      city: place.city || place.district || null,
    };
  } catch {
    return null;
  }
}

/**
 * Filtra e ordina le moschee in base alla posizione utente.
 * 
 * Logica:
 * 1. Calcola distanza per ogni moschea
 * 2. Espande il raggio finché trova MIN_RESULTS moschee
 * 3. Ordina per distanza
 * 4. Aggiunge metadati (distance, inSameCountry, inSameRegion)
 */
export function filterMosquesByLocation(mosques, userLat, userLng, userGeoContext = null) {
  if (!mosques || mosques.length === 0) return [];
  if (!userLat || !userLng) return mosques;

  // Aggiungi distanza a ogni moschea
  const withDistance = mosques
    .filter((m) => m.lat != null && m.lng != null)
    .map((m) => {
      const distance = haversineKm(userLat, userLng, m.lat, m.lng);
      const inSameCountry = userGeoContext?.country
        ? m.country === userGeoContext.country
        : true;
      const inSameRegion = userGeoContext?.region
        ? m.region === userGeoContext.region
        : false;
      return { ...m, distance: Math.round(distance * 10) / 10, inSameCountry, inSameRegion };
    })
    .concat(
      // Moschee senza coordinate — mettile in fondo
      mosques.filter((m) => m.lat == null || m.lng == null).map((m) => ({
        ...m, distance: 99999, inSameCountry: false, inSameRegion: false,
      }))
    );

  // Espansione progressiva del raggio
  let result = [];
  for (const radius of RADIUS_STEPS) {
    result = withDistance.filter((m) => m.distance <= radius);
    if (result.length >= MIN_RESULTS) break;
  }

  // Ordina: prima stesso paese, poi per distanza
  result.sort((a, b) => {
    if (a.inSameCountry && !b.inSameCountry) return -1;
    if (!a.inSameCountry && b.inSameCountry) return 1;
    return a.distance - b.distance;
  });

  return result;
}

/**
 * Raggruppa le moschee per paese per la visualizzazione a sezioni
 */
export function groupMosquesByCountry(mosques) {
  const groups = {};
  for (const m of mosques) {
    const key = m.country || 'Altro';
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  // Ordina i paesi per numero di moschee
  return Object.entries(groups)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([country, list]) => ({ country, mosques: list }));
}

/**
 * Filtra le moschee per testo di ricerca
 */
export function searchMosques(mosques, query) {
  if (!query?.trim()) return mosques;
  const q = query.toLowerCase().trim();
  return mosques.filter((m) =>
    m.name?.toLowerCase().includes(q) ||
    m.city?.toLowerCase().includes(q) ||
    m.address?.toLowerCase().includes(q) ||
    m.country?.toLowerCase().includes(q) ||
    m.region?.toLowerCase().includes(q)
  );
}

/**
 * Controlla se l'utente si è spostato significativamente
 * (usato per aggiornare automaticamente il filtro)
 */
export function hasMovedSignificantly(prevLat, prevLng, newLat, newLng, thresholdKm = 5) {
  if (!prevLat || !prevLng) return true;
  return haversineKm(prevLat, prevLng, newLat, newLng) > thresholdKm;
}
