// src/context/FeaturesContext.js
// Gestione funzionalità attive/disattive per l'utente
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FeaturesContext = createContext(null);

export const DEFAULT_FEATURES = {
  quran: true,
  dua: true,
  asmaulHusna: true,
  dhikr: true,
  qibla: true,
  calendar: true,
  ramadan: true,
  nearby: true,
};

export const FEATURE_META = {
  quran:       { label: 'Al-Quran',          icon: 'book-outline',         desc: 'Lettore del Sacro Corano' },
  dua:         { label: 'Dua & Adhkar',       icon: 'hand-left-outline',    desc: 'Preghiere e formule di ricordo' },
  asmaulHusna: { label: 'Asma ul-Husna',      icon: 'star-outline',         desc: 'I 99 nomi di Allah' },
  dhikr:       { label: 'Contatore Dhikr',    icon: 'radio-button-on',      desc: 'Conta il tuo dhikr quotidiano' },
  qibla:       { label: 'Bussola Qibla',      icon: 'compass-outline',      desc: 'Direzione della Mecca' },
  calendar:    { label: 'Calendario Islamico',icon: 'calendar-outline',     desc: 'Calendario Hijri ed eventi' },
  ramadan:     { label: 'Ramadan',            icon: 'moon-outline',         desc: 'Countdown e orari Ramadan' },
  nearby:      { label: 'Moschee Vicino',     icon: 'location-outline',     desc: 'Trova moschee con GPS' },
};

export function FeaturesProvider({ children }) {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('app_features');
        if (raw) setFeatures({ ...DEFAULT_FEATURES, ...JSON.parse(raw) });
      } catch (_) {}
    })();
  }, []);

  async function toggleFeature(key) {
    const newFeatures = { ...features, [key]: !features[key] };
    setFeatures(newFeatures);
    await AsyncStorage.setItem('app_features', JSON.stringify(newFeatures));
  }

  async function resetFeatures() {
    setFeatures(DEFAULT_FEATURES);
    await AsyncStorage.setItem('app_features', JSON.stringify(DEFAULT_FEATURES));
  }

  return (
    <FeaturesContext.Provider value={{ features, toggleFeature, resetFeatures }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  const ctx = useContext(FeaturesContext);
  if (!ctx) throw new Error('useFeatures must be used within FeaturesProvider');
  return ctx;
}
