// src/screens/MosquesScreen.js — ricerca per città/paese via OSM + Firestore
import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';
import { fetchMosquesByCity } from '../utils/osmMosques';

export default function MosquesScreen() {
  const { colors, isDark } = useTheme();
  const { allMosques, selectedMosque, selectMosque } = useApp();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [osmResults, setOsmResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Cerca su Firestore localmente
  const firestoreResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase().trim();
    return allMosques.filter((m) =>
      m.name?.toLowerCase().includes(q) ||
      m.city?.toLowerCase().includes(q) ||
      m.country?.toLowerCase().includes(q) ||
      m.region?.toLowerCase().includes(q)
    );
  }, [allMosques, search]);

  // Combina Firestore + OSM rimuovendo duplicati
  const combined = useMemo(() => {
    const all = [...firestoreResults];
    for (const osm of osmResults) {
      const isDup = firestoreResults.some((f) =>
        f.name?.toLowerCase() === osm.name?.toLowerCase() &&
        Math.abs((f.lat || 0) - osm.lat) < 0.001
      );
      if (!isDup) all.push(osm);
    }
    // Raggruppa per paese
    const groups = {};
    for (const m of all) {
      const key = m.country || 'Altro';
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups).map(([country, mosques]) => ({ country, mosques }));
  }, [firestoreResults, osmResults]);

  async function handleSearch() {
    if (!search.trim() || search.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    setOsmResults([]);
    try {
      const results = await fetchMosquesByCity(search.trim());
      setOsmResults(results);
    } catch (err) {
      console.warn('OSM search error:', err);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setSearch('');
    setOsmResults([]);
    setSearched(false);
  }

  const s = styles(colors);

  function MosqueCard({ item }) {
    const isSelected = selectedMosque?.id === item.id;
    const isVerified = item.source !== 'osm';
    return (
      <TouchableOpacity
        style={[s.card, isSelected && s.cardSelected]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('MosqueDetail', { mosque: item })}
      >
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={[s.cardName, { color: isSelected ? COLORS.primary : colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {isVerified && (
              <View style={s.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />
                <Text style={s.verifiedText}>Verificata</Text>
              </View>
            )}
          </View>
          <Text style={[s.cardAddr, { color: colors.textSecondary }]} numberOfLines={1}>
            {[item.address, item.city].filter(Boolean).join(' · ')}
          </Text>
          {item.prayerTimes?.fajr ? (
            <Text style={[s.cardTimes, { color: colors.textTertiary }]}>
              Fajr {item.prayerTimes.fajr} · Maghrib {item.prayerTimes.maghrib}
            </Text>
          ) : (
            <Text style={[s.cardTimes, { color: colors.textTertiary }]}>
              Orari Iqama non ancora inseriti
            </Text>
          )}
        </View>
        <View style={s.cardRight}>
          <TouchableOpacity
            style={[s.starBtn, isSelected && s.starBtnActive]}
            onPress={() => selectMosque(isSelected ? null : item)}
          >
            <Ionicons name={isSelected ? 'star' : 'star-outline'} size={16}
              color={isSelected ? COLORS.primary : colors.textTertiary} />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <Text style={s.headerTitle}>Cerca Moschea</Text>
        <Text style={s.headerSub}>Cerca per città, paese o nome</Text>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <View style={[s.searchBar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={COLORS.primary} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            placeholder="Es: Milano, France, Al-Noor..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.searchBtn, loading && { opacity: 0.7 }]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.searchBtnText}>Cerca</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Fonte dati */}
      {searched && !loading && (
        <View style={[s.sourceBanner, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Ionicons name="globe-outline" size={13} color={colors.textTertiary} />
          <Text style={[s.sourceText, { color: colors.textTertiary }]}>
            {osmResults.length} da OpenStreetMap · {firestoreResults.length} verificate
          </Text>
        </View>
      )}

      {/* Stato iniziale */}
      {!searched && (
        <View style={s.emptyState}>
          <Ionicons name="search-outline" size={56} color={colors.textTertiary} />
          <Text style={[s.emptyTitle, { color: colors.text }]}>Cerca la tua moschea</Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            Usa OpenStreetMap per trovare moschee in tutto il mondo
          </Text>
          <View style={s.chips}>
            {['Milano', 'Roma', 'Paris', 'Berlin', 'London', 'Brussels'].map((ex) => (
              <TouchableOpacity
                key={ex}
                style={[s.chip, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                onPress={() => { setSearch(ex); }}
              >
                <Text style={[s.chipText, { color: colors.textSecondary }]}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.nearbyLink} onPress={() => navigation.navigate('Nearby')}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={s.nearbyLinkText}>Oppure usa la posizione GPS →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>
            Ricerca su OpenStreetMap...
          </Text>
        </View>
      )}

      {/* Risultati */}
      {!loading && searched && (
        <FlatList
          data={combined}
          keyExtractor={(item) => item.country}
          renderItem={({ item: group }) => (
            <View>
              <View style={s.groupHeader}>
                <Text style={[s.groupTitle, { color: colors.textSecondary }]}>{group.country}</Text>
                <Text style={[s.groupCount, { color: colors.textTertiary }]}>{group.mosques.length}</Text>
              </View>
              {group.mosques.map((mosque) => <MosqueCard key={mosque.id} item={mosque} />)}
            </View>
          )}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.noResults}>
              <Ionicons name="location-outline" size={36} color={colors.textTertiary} />
              <Text style={[s.noResultsTitle, { color: colors.text }]}>Nessuna moschea trovata</Text>
              <Text style={[s.noResultsSub, { color: colors.textSecondary }]}>per "{search}"</Text>
              <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddMosque')}>
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text style={s.addBtnText}>Aggiungi questa moschea</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '500' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  searchWrap: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 0.5, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  searchBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center', minWidth: 60, alignItems: 'center' },
  searchBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  sourceBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7, borderBottomWidth: 0.5 },
  sourceText: { fontSize: 11 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '500', marginTop: 8 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  chip: { borderRadius: 20, borderWidth: 0.5, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { fontSize: 13 },
  nearbyLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  nearbyLinkText: { color: COLORS.primary, fontSize: 13, fontWeight: '500' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  groupTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  groupCount: { fontSize: 11 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bgSecondary, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: c.border },
  cardSelected: { borderColor: COLORS.primaryBorder, backgroundColor: COLORS.primaryBg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: '500', flex: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.primaryBg, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  verifiedText: { color: COLORS.primary, fontSize: 9, fontWeight: '500' },
  cardAddr: { fontSize: 12, marginBottom: 3 },
  cardTimes: { fontSize: 11 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: c.border },
  starBtnActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder },
  noResults: { alignItems: 'center', paddingTop: 40, gap: 8 },
  noResultsTitle: { fontSize: 16, fontWeight: '500' },
  noResultsSub: { fontSize: 13 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 18, marginTop: 12 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
