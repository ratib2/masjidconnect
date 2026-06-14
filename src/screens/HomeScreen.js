// src/screens/HomeScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp, PRAYER_NAMES } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CitySearchModal from '../components/CitySearchModal';
import { calculatePrayerTimes, getNextPrayer } from '../utils/prayerTimes';

const PRAYER_ICONS = {
  fajr: 'moon-outline',
  shuruq: 'sunny-outline',
  dhuhr: 'sunny',
  asr: 'partly-sunny-outline',
  maghrib: 'cloudy-night-outline',
  isha: 'star-outline',
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const {
    selectedMosque, prayerTimes: contextPrayerTimes,
    iqamaTimes, nextPrayer: contextNextPrayer,
    location, loadMosques, loading, timeFormat,
  } = useApp();
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [manualCity, setManualCity] = useState(null);
  const [manualPrayerTimes, setManualPrayerTimes] = useState(null);
  const [manualNextPrayer, setManualNextPrayer] = useState(null);

  // Usa orari manuali se città selezionata, altrimenti quelli dal context
  const prayerTimes = manualPrayerTimes || contextPrayerTimes;
  const nextPrayer = manualNextPrayer || contextNextPrayer;

  function handleSelectCity(city) {
    setManualCity(city);
    // Calcola orari per la città selezionata
    const times = calculatePrayerTimes(city.lat, city.lng, new Date());
    setManualPrayerTimes(times);
    setManualNextPrayer(getNextPrayer(times, {}));
  }

  function clearManualCity() {
    setManualCity(null);
    setManualPrayerTimes(null);
    setManualNextPrayer(null);
  }

  function formatTime(time) {
    if (!time || time === '--:--') return time;
    if (timeFormat === '12h') {
      const [h, m] = time.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
    }
    return time;
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadMosques();
    setRefreshing(false);
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const displayLocation = manualCity
    ? `${manualCity.name}, ${manualCity.country}`
    : selectedMosque?.name || location?.city || '...';

  const s = styles(colors);

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <CitySearchModal
        visible={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelectCity={handleSelectCity}
        currentCity={location?.city}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.headerDate}>{today}</Text>
              <TouchableOpacity onPress={() => setShowCityModal(true)} activeOpacity={0.7}>
                <View style={s.locationRow}>
                  <Ionicons name="location" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={s.locationName} numberOfLines={1}>{displayLocation}</Text>
                  <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.7)" />
                </View>
              </TouchableOpacity>
              {manualCity && (
                <TouchableOpacity onPress={clearManualCity} style={s.clearCity}>
                  <Text style={s.clearCityText}>✕ Torna alla posizione GPS</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={s.bellBtn} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Next prayer card */}
          {nextPrayer && (
            <View style={s.nextCard}>
              <Text style={s.nextLabel}>{t('nextPrayer')}</Text>
              <View style={s.nextRow}>
                <Text style={s.nextName}>{t(nextPrayer.name)}</Text>
                <Text style={s.nextTime}>{formatTime(nextPrayer.time)}</Text>
              </View>
              <View style={s.nextFooter}>
                {nextPrayer.iqamaTime && (
                  <Text style={s.nextSub}>{t('iqama')}: {formatTime(nextPrayer.iqamaTime)}</Text>
                )}
                <Text style={s.nextSub}>{t('timeRemaining', { time: nextPrayer.remainingLabel })}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Source banner */}
        <View style={s.sourceBanner}>
          <Ionicons
            name={selectedMosque && !manualCity ? 'shield-checkmark' : 'calculator-outline'}
            size={13}
            color={selectedMosque && !manualCity ? COLORS.primary : colors.textTertiary}
          />
          <Text style={[s.sourceText, { color: selectedMosque && !manualCity ? COLORS.primary : colors.textTertiary }]}>
            {manualCity
              ? `Orari calcolati per ${manualCity.name}`
              : selectedMosque
                ? t('updatedBy')
                : t('calculatedTimes')}
          </Text>
        </View>

        {/* Prayer times list */}
        <View style={s.listContainer}>
          <Text style={s.sectionTitle}>{t('prayerTimes')}</Text>
          {PRAYER_NAMES.map((name) => {
            const isNext = nextPrayer?.name === name;
            const time = prayerTimes?.[name];
            const iqama = iqamaTimes?.[name];
            return (
              <View key={name} style={[s.prayerRow, isNext && s.prayerRowActive]}>
                <View style={s.prayerLeft}>
                  <View style={[s.iconWrap, isNext && s.iconWrapActive]}>
                    <Ionicons
                      name={PRAYER_ICONS[name] || 'time-outline'}
                      size={16}
                      color={isNext ? COLORS.primary : colors.textSecondary}
                    />
                  </View>
                  <Text style={[s.prayerName, isNext && s.prayerNameActive]}>{t(name)}</Text>
                </View>
                <View style={s.prayerRight}>
                  <Text style={[s.prayerTime, isNext && s.prayerTimeActive]}>
                    {formatTime(time) || '--:--'}
                  </Text>
                  {iqama && (
                    <Text style={s.iqamaTime}>{t('iqama')} {formatTime(iqama)}</Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Jumuah */}
          {prayerTimes?.jumuah && (
            <View style={[s.prayerRow, { borderStyle: 'dashed', borderWidth: 0.5, borderColor: colors.border }]}>
              <View style={s.prayerLeft}>
                <View style={s.iconWrap}>
                  <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                </View>
                <Text style={s.prayerName}>{t('jumuah')}</Text>
              </View>
              <Text style={[s.prayerTime, { color: colors.text }]}>{formatTime(prayerTimes.jumuah)}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  scroll: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerDate: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationName: { color: '#fff', fontSize: 15, fontWeight: '500', flex: 1 },
  clearCity: { marginTop: 4 },
  clearCityText: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  bellBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  nextCard: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 14, padding: 14 },
  nextLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 4 },
  nextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  nextName: { color: '#fff', fontSize: 24, fontWeight: '500', flex: 1 },
  nextTime: { color: '#fff', fontSize: 24, fontWeight: '500', minWidth: 70, textAlign: 'right' },
  nextFooter: { flexDirection: 'row', gap: 12, marginTop: 4 },
  nextSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  sourceBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: c.border },
  sourceText: { fontSize: 11 },
  listContainer: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: { color: c.textSecondary, fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  prayerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4, backgroundColor: c.bgSecondary, overflow: 'visible' },
  prayerRowActive: { backgroundColor: COLORS.primaryBg, borderWidth: 0.5, borderColor: COLORS.primaryBorder },
  prayerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  prayerRight: { alignItems: 'flex-end', minWidth: 80 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: '#fff' },
  prayerName: { color: c.textSecondary, fontSize: 14, flex: 1 },
  prayerNameActive: { color: COLORS.primary, fontWeight: '500' },
  prayerTime: { color: c.text, fontSize: 14, fontWeight: '500', minWidth: 45, textAlign: 'right' },
  prayerTimeActive: { color: COLORS.primary, minWidth: 45, textAlign: 'right' },
  iqamaTime: { color: c.textTertiary, fontSize: 10, marginTop: 2 },
});
