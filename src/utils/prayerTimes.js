// src/utils/prayerTimes.js
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';

// Available calculation methods
export const CALCULATION_METHODS = {
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Egyptian General Authority',
  Karachi: 'University of Islamic Sciences, Karachi',
  UmmAlQura: 'Umm Al-Qura University, Makkah',
  Dubai: 'Dubai',
  MoonsightingCommittee: 'Moonsighting Committee',
  NorthAmerica: 'Islamic Society of North America',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
  Singapore: 'Majlis Ugama Islam Singapura',
  Turkey: 'Diyanet İşleri Başkanlığı',
  Tehran: 'Institute of Geophysics, University of Tehran',
};

/**
 * Calculate prayer times for a given location and date.
 * Returns { fajr, shuruq, dhuhr, asr, maghrib, isha } as "HH:mm" strings.
 */
export function calculatePrayerTimes(lat, lng, date = new Date(), methodKey = 'MuslimWorldLeague') {
  const coordinates = new Coordinates(lat, lng);
  const params = CalculationMethod[methodKey]();
  const times = new PrayerTimes(coordinates, date, params);

  return {
    fajr: formatTime(times.fajr),
    shuruq: formatTime(times.sunrise),
    dhuhr: formatTime(times.dhuhr),
    asr: formatTime(times.asr),
    maghrib: formatTime(times.maghrib),
    isha: formatTime(times.isha),
  };
}

/**
 * Calculate Qibla direction from a given location.
 * Returns degrees from North (0–360).
 */
export function calculateQibla(lat, lng) {
  const coordinates = new Coordinates(lat, lng);
  return Qibla(coordinates); // degrees clockwise from North
}

/**
 * Calculate distance to Makkah in km.
 */
export function distanceToMakkah(lat, lng) {
  const MAKKAH_LAT = 21.3891;
  const MAKKAH_LNG = 39.8579;
  return haversineDistance(lat, lng, MAKKAH_LAT, MAKKAH_LNG);
}

/**
 * Get the next prayer name and time from a prayerTimes object.
 * prayerTimes = { fajr, shuruq, dhuhr, asr, maghrib, isha } (HH:mm strings)
 */
export function getNextPrayer(prayerTimes, iqamaTimes = {}) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'];

  for (const name of prayers) {
    if (!prayerTimes[name]) continue;
    const [h, m] = prayerTimes[name].split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > nowMinutes) {
      const remaining = prayerMinutes - nowMinutes;
      return {
        name,
        time: prayerTimes[name],
        iqamaTime: iqamaTimes[name] || null,
        remainingMinutes: remaining,
        remainingLabel: formatRemaining(remaining),
      };
    }
  }

  // After Isha — next is Fajr tomorrow
  if (prayerTimes.fajr) {
    const [h, m] = prayerTimes.fajr.split(':').map(Number);
    const fajrMinutes = h * 60 + m;
    const remaining = 1440 - nowMinutes + fajrMinutes;
    return {
      name: 'fajr',
      time: prayerTimes.fajr,
      iqamaTime: iqamaTimes.fajr || null,
      remainingMinutes: remaining,
      remainingLabel: formatRemaining(remaining),
    };
  }

  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(date) {
  if (!date) return '--:--';
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatRemaining(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}
