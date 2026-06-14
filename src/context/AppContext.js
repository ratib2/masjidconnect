// src/context/AppContext.js — con filtro geografico intelligente
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import i18n from '../utils/i18n';
import { calculatePrayerTimes, getNextPrayer, distanceToMakkah } from '../utils/prayerTimes';
import { fetchAllMosques } from '../utils/firebase';
import {
  filterMosquesByLocation,
  searchMosques,
  hasMovedSignificantly,
} from '../utils/geoFilter';

const AppContext = createContext(null);
export const PRAYER_NAMES = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function AppProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [geoContext, setGeoContext] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [selectedMosque, setSelectedMosque] = useState(null);
  const [allMosques, setAllMosques] = useState([]);
  const [nearbyMosques, setNearbyMosques] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [iqamaTimes, setIqamaTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [language, setLanguageState] = useState('en');
  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');
  const [adhanSound, setAdhanSound] = useState('adhan_makkah');
  const [theme, setTheme] = useState('system');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [loading, setLoading] = useState(true);

  const lastLocationRef = useRef(null);
  const locationWatcherRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.multiGet([
          'language', 'calculationMethod', 'adhanSound', 'theme', 'timeFormat', 'selectedMosqueId',
        ]);
        const prefs = Object.fromEntries(stored);
        if (prefs.language) { setLanguageState(prefs.language); i18n.changeLanguage(prefs.language); }
        if (prefs.calculationMethod) setCalculationMethod(prefs.calculationMethod);
        if (prefs.adhanSound) setAdhanSound(prefs.adhanSound);
        if (prefs.theme) setTheme(prefs.theme);
        if (prefs.timeFormat) setTimeFormat(prefs.timeFormat);
        if (prefs.selectedMosqueId) setSelectedMosque({ _pendingId: prefs.selectedMosqueId });
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    startLocationTracking();
    loadMosques();
    return () => { if (locationWatcherRef.current) locationWatcherRef.current.remove(); };
  }, []);

  async function startLocationTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
    if (status !== 'granted') return;

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await updateLocation(loc.coords.latitude, loc.coords.longitude);

    locationWatcherRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 1000, timeInterval: 60000 },
      async (newLoc) => {
        const { latitude, longitude } = newLoc.coords;
        if (hasMovedSignificantly(lastLocationRef.current?.lat, lastLocationRef.current?.lng, latitude, longitude, 5)) {
          await updateLocation(latitude, longitude);
        }
      }
    );
  }

  async function updateLocation(lat, lng) {
    lastLocationRef.current = { lat, lng };
    let city = '';
    let geoCtx = null;
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      city = place?.city || place?.district || '';
      geoCtx = {
        country: place?.country || null,
        countryCode: place?.isoCountryCode || null,
        region: place?.region || place?.subregion || null,
        city,
      };
    } catch (_) {}
    setLocation({ lat, lng, city });
    setGeoContext(geoCtx);
  }

  async function requestLocation() { await startLocationTracking(); }

  async function loadMosques() {
    try {
      const all = await fetchAllMosques();
      setAllMosques(all);
    } catch (_) {}
  }

  useEffect(() => {
    if (allMosques.length === 0) return;
    const filtered = filterMosquesByLocation(allMosques, location?.lat, location?.lng, geoContext);
    setNearbyMosques(filtered);
  }, [allMosques, location, geoContext]);

  useEffect(() => {
    if (selectedMosque?._pendingId && allMosques.length > 0) {
      const found = allMosques.find((m) => m.id === selectedMosque._pendingId);
      setSelectedMosque(found || null);
    }
  }, [allMosques]);

  useEffect(() => {
    if (selectedMosque && selectedMosque.prayerTimes) {
      setPrayerTimes(selectedMosque.prayerTimes);
      setIqamaTimes(selectedMosque.iqamaTimes || {});
    } else if (location) {
      const times = calculatePrayerTimes(location.lat, location.lng, new Date(), calculationMethod);
      setPrayerTimes(times);
      setIqamaTimes({});
    }
  }, [selectedMosque, location, calculationMethod]);

  useEffect(() => {
    if (!prayerTimes) return;
    const update = () => setNextPrayer(getNextPrayer(prayerTimes, iqamaTimes));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [prayerTimes, iqamaTimes]);

  const displayedMosques = searchQuery.trim()
    ? searchMosques(nearbyMosques, searchQuery)
    : nearbyMosques;

  const selectMosque = useCallback(async (mosque) => {
    setSelectedMosque(mosque);
    if (mosque) await AsyncStorage.setItem('selectedMosqueId', mosque.id);
    else await AsyncStorage.removeItem('selectedMosqueId');
  }, []);

  const setLanguage = useCallback(async (lang) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    await AsyncStorage.setItem('language', lang);
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    switch (key) {
      case 'calculationMethod': setCalculationMethod(value); break;
      case 'adhanSound': setAdhanSound(value); break;
      case 'theme': setTheme(value); break;
      case 'timeFormat': setTimeFormat(value); break;
    }
    await AsyncStorage.setItem(key, String(value));
  }, []);

  return (
    <AppContext.Provider value={{
      location, geoContext, locationPermission, requestLocation,
      selectedMosque, selectMosque,
      allMosques, nearbyMosques: displayedMosques,
      searchQuery, setSearchQuery,
      loadMosques, prayerTimes, iqamaTimes, nextPrayer,
      language, setLanguage,
      calculationMethod, adhanSound, theme, timeFormat, updateSetting,
      loading,
      qiblaDistance: location ? distanceToMakkah(location.lat, location.lng) : null,
      userCountry: geoContext?.country,
      userRegion: geoContext?.region,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// NOTA: timeFormat aggiunto — sostituisci la riga delle dipendenze in AppContext
// con questa versione che include timeFormat
