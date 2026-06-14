// src/screens/NearbyScreen.js
// Moschee vicino — OpenStreetMap + Firestore combinati
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';
import { fetchMosquesFromOSM } from '../utils/osmMosques';
import { haversineKm } from '../utils/geoFilter';

export default function NearbyScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const {
    nearbyMosques: firestoreMosques,
    selectedMosque, selectMosque,
    location, geoContext, locationPermission, requestLocation,
    loadMosques, userCountry,
  } = useApp();

  const [osmMosques, setOsmMosques] = useState([]);
  const [loadingOSM, setLoadingOSM] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentRadius, setCurrentRadius] = useState(10);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastFetchedLocation = useRef(null);

  useEffect(() => {
    if (!location) return;
    // Evita di rifetching se la posizione non è cambiata significativamente
    const prev = lastFetchedLocation.current;
    if (prev) {
      const dist = haversineKm(prev.lat, prev.lng, location.lat, location.lng);
      if (dist < 1) return;
    }
    lastFetchedLocation.current = location;
    fetchOSM(location.lat, location.lng, 10);
  }, [location]);

  useEffect(() => {
    if (!location) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [location]);

  async function fetchOSM(lat, lng, radius) {
    setLoadingOSM(true);
    setCurrentRadius(radius);
    try {
      let results = await fetchMosquesFromOSM(lat, lng, radius);
      // Espandi raggio se trova meno di 3
      if (results.length < 3 && radius < 100) {
        const newRadius = radius === 10 ? 25 : radius === 25 ? 50 : 100;
        results = await fetchMosquesFromOSM(lat, lng, newRadius);
        setCurrentRadius(newRadius);
      }
      setOsmMosques(results);
    } catch (err) {
      console.warn('OSM fetch error:', err.message);
    } finally {
      setLoadingOSM(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadMosques();
    if (location) await fetchOSM(location.lat, location.lng, 10);
    setRefreshing(false);
  }

  // Unisci Firestore + OSM, rimuovi duplicati per nome+città
  const combined = React.useMemo(() => {
    const all = [...firestoreMosques];
    for (const osm of osmMosques) {
      const isDup = firestoreMosques.some((f) =>
        f.name?.toLowerCase() === osm.name?.toLowerCase() &&
        Math.abs((f.lat || 0) - osm.lat) < 0.001
      );
      if (!isDup) all.push(osm);
    }
    return all.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
  }, [firestoreMosques, osmMosques]);

  const s = styles(colors);

  function MosqueCard({ item, index }) {
    const isSelected = selectedMosque?.id === item.id;
    const isFirestore = item.source !== 'osm';
    const nextP = getNextPrayer(item.prayerTimes);

    return (
      <TouchableOpacity
        style={[s.card, isSelected && s.cardSelected]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('MosqueDetail', { mosque: item })}
      >
        <View style={[s.rank, index < 3 && s.rankTop]}>
          <Text style={[s.rankText, index < 3 && { color: COLORS.primary }]}>{index + 1}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={[s.cardName, { color: isSelected ? COLORS.primary : colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {isFirestore && (
              <View style={s.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />
                <Text style={s.verifiedText}>Verificata</Text>
              </View>
            )}
          </View>
          <Text style={[s.cardAddr, { color: colors.textSecondary }]} numberOfLines={1}>
            {[item.address, item.city].filter(Boolean).join(' · ')}
          </Text>
          {nextP ? (
            <Text style={[s.cardNext, { color: colors.textTertiary }]}>
              Prossima: {nextP.name} {nextP.time}
            </Text>
          ) : (
            <Text style={[s.cardNext, { color: colors.textTertiary }]}>
              Tocca per aggiungere gli orari Iqama
            </Text>
          )}
        </View>

        <View style={s.cardRight}>
          {item.distance != null && (
            <Text style={[s.dist, { color: COLORS.primary }]}>
              {item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance}km`}
            </Text>
          )}
          <TouchableOpacity
            style={[s.starBtn, isSelected && s.starBtnActive]}
            onPress={() => selectMosque(isSelected ? null : item)}
          >
            <Ionicons name={isSelected ? 'star' : 'star-outline'} size={16}
              color={isSelected ? COLORS.primary : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <View>
          <Text style={s.headerTitle}>Moschee Vicino</Text>
          {location && (
            <View style={s.locationRow}>
              <Animated.View style={[s.dot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={s.locationText}>
                {geoContext?.city || location.city || 'Posizione rilevata'}
                {userCountry ? ` · ${userCountry}` : ''}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info raggio */}
      {(combined.length > 0 || loadingOSM) && (
        <View style={[s.radiusBanner, { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder }]}>
          {loadingOSM ? (
            <>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={s.radiusText}>Ricerca moschee in corso...</Text>
            </>
          ) : (
            <>
              <Ionicons name="radio-outline" size={13} color={COLORS.primary} />
              <Text style={s.radiusText}>
                <Text style={{ fontWeight: '600' }}>{combined.length}</Text> moschee nel raggio di{' '}
                <Text style={{ fontWeight: '600' }}>{currentRadius}km</Text>
                {' · '}OpenStreetMap
              </Text>
            </>
          )}
        </View>
      )}

      {/* No location */}
      {locationPermission !== 'granted' && (
        <View style={s.center}>
          <Ionicons name="location-outline" size={48} color={colors.textTertiary} />
          <Text style={[s.centerTitle, { color: colors.text }]}>Posizione non disponibile</Text>
          <Text style={[s.centerSub, { color: colors.textSecondary }]}>
            Abilita la posizione per trovare le moschee vicino a te
          </Text>
          <TouchableOpacity style={s.enableBtn} onPress={requestLocation}>
            <Text style={s.enableBtnText}>Abilita posizione</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading iniziale */}
      {locationPermission === 'granted' && !location && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[s.centerSub, { color: colors.textSecondary }]}>Rilevamento posizione...</Text>
        </View>
      )}

      {/* Lista */}
      {location && (
        <FlatList
          data={combined}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <MosqueCard item={item} index={index} />}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            !loadingOSM ? (
              <View style={s.center}>
                <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
                <Text style={[s.centerTitle, { color: colors.text }]}>Nessuna moschea trovata</Text>
                <Text style={[s.centerSub, { color: colors.textSecondary }]}>
                  Prova ad aggiornare o aggiungi la tua moschea
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            combined.length > 0 ? (
              <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddMosque')}>
                <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
                <Text style={s.addBtnText}>La tua moschea non è nella lista? Aggiungila</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {location && (
        <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('AddMosque')}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function getNextPrayer(prayerTimes) {
  if (!prayerTimes) return null;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const [name, time] of [['Fajr','fajr'],['Dhuhr','dhuhr'],['Asr','asr'],['Maghrib','maghrib'],['Isha','isha']]) {
    if (!prayerTimes[time]) continue;
    const [h, m] = prayerTimes[time].split(':').map(Number);
    if (h * 60 + m > nowMin) return { name, time: prayerTimes[time] };
  }
  return prayerTimes.fajr ? { name: 'Fajr', time: prayerTimes.fajr } : null;
}

const styles = (c) => StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4fffb0' },
  locationText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  refreshBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  radiusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 0.5 },
  radiusText: { fontSize: 12, color: COLORS.primary, flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  centerTitle: { fontSize: 17, fontWeight: '500', textAlign: 'center' },
  centerSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  enableBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  enableBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  list: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bgSecondary, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: c.border },
  cardSelected: { borderColor: COLORS.primaryBorder, borderWidth: 1, backgroundColor: COLORS.primaryBg },
  rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.bg, borderWidth: 0.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rankTop: { borderColor: COLORS.primaryBorder, backgroundColor: COLORS.primaryBg },
  rankText: { fontSize: 12, fontWeight: '600', color: c.textTertiary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: '500', flex: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.primaryBg, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  verifiedText: { color: COLORS.primary, fontSize: 9, fontWeight: '500' },
  cardAddr: { fontSize: 12, marginBottom: 3 },
  cardNext: { fontSize: 11 },
  cardRight: { alignItems: 'center', gap: 6, flexShrink: 0 },
  dist: { fontSize: 13, fontWeight: '600' },
  starBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: c.border },
  starBtnActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 14 },
  addBtnText: { color: COLORS.primary, fontSize: 13 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },
});
