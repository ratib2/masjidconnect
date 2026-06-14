// src/components/CitySearchModal.js
// Modale per impostare manualmente la città/posizione
// Usato nella Home quando l'utente vuole vedere orari per una città specifica

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  FlatList, StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme, COLORS } from '../utils/theme';

// Città suggerite per ricerca rapida
const SUGGESTED_CITIES = [
  { name: 'Milano', country: 'Italy', lat: 45.4642, lng: 9.1900 },
  { name: 'Roma', country: 'Italy', lat: 41.9028, lng: 12.4964 },
  { name: 'Torino', country: 'Italy', lat: 45.0703, lng: 7.6869 },
  { name: 'Bologna', country: 'Italy', lat: 44.4949, lng: 11.3426 },
  { name: 'Firenze', country: 'Italy', lat: 43.7696, lng: 11.2558 },
  { name: 'Napoli', country: 'Italy', lat: 40.8518, lng: 14.2681 },
  { name: 'Genova', country: 'Italy', lat: 44.4056, lng: 8.9463 },
  { name: 'Crevalcore', country: 'Italy', lat: 44.7239, lng: 11.1483 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Lyon', country: 'France', lat: 45.7640, lng: 4.8357 },
  { name: 'Marseille', country: 'France', lat: 43.2965, lng: 5.3698 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { name: 'München', country: 'Germany', lat: 48.1351, lng: 11.5820 },
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Birmingham', country: 'UK', lat: 52.4862, lng: -1.8904 },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
];

export default function CitySearchModal({ visible, onClose, onSelectCity, currentCity }) {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResults, setGeocodeResults] = useState([]);

  const s = styles(colors);

  // Filtra le città suggerite
  const filteredSuggestions = query.trim().length >= 2
    ? SUGGESTED_CITIES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.country.toLowerCase().includes(query.toLowerCase())
      )
    : SUGGESTED_CITIES;

  // Geocoding per trovare qualsiasi città nel mondo
  async function searchCity() {
    if (query.trim().length < 2) return;
    setGeocoding(true);
    try {
      const results = await Location.geocodeAsync(query.trim());
      if (results && results.length > 0) {
        // Reverse geocode per ottenere il nome leggibile
        const enriched = await Promise.all(
          results.slice(0, 5).map(async (r) => {
            try {
              const [place] = await Location.reverseGeocodeAsync({
                latitude: r.latitude,
                longitude: r.longitude,
              });
              return {
                name: place?.city || place?.district || query,
                country: place?.country || '',
                region: place?.region || '',
                lat: r.latitude,
                lng: r.longitude,
              };
            } catch {
              return {
                name: query,
                country: '',
                region: '',
                lat: r.latitude,
                lng: r.longitude,
              };
            }
          })
        );
        // Deduplica per città
        const unique = enriched.filter((v, i, a) =>
          a.findIndex((t) => t.name === v.name && t.country === v.country) === i
        );
        setGeocodeResults(unique);
      } else {
        setGeocodeResults([]);
      }
    } catch (err) {
      setGeocodeResults([]);
    } finally {
      setGeocoding(false);
    }
  }

  function handleSelect(city) {
    onSelectCity(city);
    setQuery('');
    setGeocodeResults([]);
    onClose();
  }

  const displayList = geocodeResults.length > 0 ? geocodeResults : filteredSuggestions;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Text style={[s.title, { color: colors.text }]}>Scegli città</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={s.searchWrap}>
          <View style={[s.searchBar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={COLORS.primary} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              placeholder="Cerca città o paese..."
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchCity}
              returnKeyType="search"
              autoFocus
            />
            {geocoding && <ActivityIndicator size="small" color={COLORS.primary} />}
            {query.length > 0 && !geocoding && (
              <TouchableOpacity onPress={() => { setQuery(''); setGeocodeResults([]); }}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={s.searchBtn} onPress={searchCity}>
            <Text style={s.searchBtnText}>Cerca</Text>
          </TouchableOpacity>
        </View>

        {/* Città corrente */}
        {currentCity && (
          <View style={[s.currentCity, { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder }]}>
            <Ionicons name="location" size={13} color={COLORS.primary} />
            <Text style={s.currentCityText}>Posizione attuale: {currentCity}</Text>
          </View>
        )}

        {/* Lista risultati */}
        <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>
          {geocodeResults.length > 0 ? 'Risultati ricerca' : 'Città suggerite'}
        </Text>
        <FlatList
          data={displayList}
          keyExtractor={(item, i) => `${item.name}-${item.country}-${i}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.cityRow, { borderBottomColor: colors.border }]}
              onPress={() => handleSelect(item)}
            >
              <View style={s.cityIcon}>
                <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.cityName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[s.cityCountry, { color: colors.textSecondary }]}>
                  {[item.region, item.country].filter(Boolean).join(', ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query.length > 1 && !geocoding ? (
              <View style={s.noResults}>
                <Text style={[s.noResultsText, { color: colors.textSecondary }]}>
                  Nessun risultato per "{query}". Premi Cerca.
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </Modal>
  );
}

const styles = (c) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24, borderBottomWidth: 0.5 },
  title: { fontSize: 18, fontWeight: '500' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  searchBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  currentCity: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 8, borderRadius: 8, padding: 8, borderWidth: 0.5 },
  currentCityText: { color: COLORS.primary, fontSize: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingBottom: 6 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  cityIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  cityName: { fontSize: 15, fontWeight: '500' },
  cityCountry: { fontSize: 12, marginTop: 1 },
  noResults: { padding: 20, alignItems: 'center' },
  noResultsText: { fontSize: 13, textAlign: 'center' },
});
