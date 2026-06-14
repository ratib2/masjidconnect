// src/screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Switch, TouchableOpacity,
  ScrollView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';
import {
  requestNotificationPermissions,
  scheduleAdhanNotifications,
  cancelAllAdhanNotifications,
  getScheduledNotifications,
} from '../utils/notifications';

const PRAYERS = [
  { key: 'fajr',    label: 'Fajr',    icon: 'moon-outline',         color: '#4f46e5' },
  { key: 'dhuhr',   label: 'Dhuhr',   icon: 'sunny',                color: '#f59e0b' },
  { key: 'asr',     label: 'Asr',     icon: 'partly-sunny-outline', color: '#f97316' },
  { key: 'maghrib', label: 'Maghrib', icon: 'cloudy-night-outline',  color: '#ec4899' },
  { key: 'isha',    label: 'Isha',    icon: 'star-outline',          color: '#8b5cf6' },
];

const MINUTES_OPTIONS = [0, 5, 10, 15, 20, 30];

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { prayerTimes, iqamaTimes, selectedMosque, language } = useApp();

  const [enabled, setEnabled] = useState(true);
  const [prayers, setPrayers] = useState({
    fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true,
  });
  const [minutesBefore, setMinutesBefore] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    loadSettings();
    checkPermission();
    loadScheduledCount();
  }, []);

  async function checkPermission() {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
  }

  async function loadSettings() {
    try {
      const raw = await AsyncStorage.getItem('notification_settings');
      if (raw) {
        const s = JSON.parse(raw);
        setEnabled(s.enabled ?? true);
        setPrayers(s.prayers ?? { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true });
        setMinutesBefore(s.minutesBefore ?? 0);
      }
    } catch (_) {}
  }

  async function loadScheduledCount() {
    const scheduled = await getScheduledNotifications();
    setScheduledCount(scheduled.length);
  }

  async function saveAndSchedule() {
    setSaving(true);
    try {
      const settings = { enabled, prayers, minutesBefore, language };
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));

      if (enabled && prayerTimes) {
        await scheduleAdhanNotifications(prayerTimes, iqamaTimes || {}, {
          ...settings,
          mosqueName: selectedMosque?.name || null,
        });
        await loadScheduledCount();
        Alert.alert(
          '✓ Notifiche attivate',
          `Pianificate le notifiche Adhan per i prossimi 7 giorni.`,
          [{ text: 'OK' }]
        );
      } else {
        await cancelAllAdhanNotifications();
        setScheduledCount(0);
        Alert.alert('Notifiche disattivate', 'Le notifiche Adhan sono state cancellate.');
      }
    } catch (err) {
      Alert.alert('Errore', err.message);
    } finally {
      setSaving(false);
    }
  }

  const s = styles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifiche Adhan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Permission warning */}
        {hasPermission === false && (
          <View style={[s.warningCard, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
            <Ionicons name="warning-outline" size={18} color="#92400e" />
            <View style={{ flex: 1 }}>
              <Text style={s.warningTitle}>Permesso notifiche mancante</Text>
              <Text style={s.warningText}>Vai in Impostazioni telefono → App → MasjidConnect → Notifiche → Abilita</Text>
            </View>
          </View>
        )}

        {/* Master switch */}
        <View style={[s.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.iconWrap, { backgroundColor: COLORS.primaryBg }]}>
                <Ionicons name="notifications" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[s.rowLabel, { color: colors.text }]}>Notifiche Adhan</Text>
                <Text style={[s.rowSub, { color: colors.textTertiary }]}>
                  {scheduledCount > 0 ? `${scheduledCount} notifiche pianificate` : 'Nessuna notifica attiva'}
                </Text>
              </View>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.border, true: COLORS.primaryLight }}
              thumbColor={enabled ? COLORS.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {enabled && (
          <>
            {/* Prayer toggles */}
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>PREGHIERE</Text>
            <View style={[s.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              {PRAYERS.map((p, i) => (
                <View key={p.key} style={[s.row, i < PRAYERS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                  <View style={s.rowLeft}>
                    <View style={[s.iconWrap, { backgroundColor: p.color + '20' }]}>
                      <Ionicons name={p.icon} size={16} color={p.color} />
                    </View>
                    <View>
                      <Text style={[s.rowLabel, { color: colors.text }]}>{p.label}</Text>
                      {prayerTimes?.[p.key] && (
                        <Text style={[s.rowSub, { color: colors.textTertiary }]}>
                          {prayerTimes[p.key]}
                          {iqamaTimes?.[p.key] ? ` · Iqama ${iqamaTimes[p.key]}` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Switch
                    value={prayers[p.key]}
                    onValueChange={(v) => setPrayers((prev) => ({ ...prev, [p.key]: v }))}
                    trackColor={{ false: colors.border, true: p.color + '80' }}
                    thumbColor={prayers[p.key] ? p.color : '#f4f3f4'}
                  />
                </View>
              ))}
            </View>

            {/* Minutes before */}
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>ANTICIPO NOTIFICA</Text>
            <View style={[s.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={s.minutesGrid}>
                {MINUTES_OPTIONS.map((min) => (
                  <TouchableOpacity
                    key={min}
                    style={[s.minBtn, minutesBefore === min && s.minBtnActive]}
                    onPress={() => setMinutesBefore(min)}
                  >
                    <Text style={[s.minText, minutesBefore === min && { color: COLORS.primary, fontWeight: '600' }]}>
                      {min === 0 ? 'Esatto' : `${min} min`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.hint, { color: colors.textTertiary }]}>
                {minutesBefore === 0
                  ? 'La notifica arriva esattamente all\'orario della preghiera'
                  : `La notifica arriva ${minutesBefore} minuti prima della preghiera`}
              </Text>
            </View>

            {/* Moschea info */}
            {selectedMosque && (
              <View style={[s.mosqueBanner, { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder }]}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
                <Text style={s.mosqueBannerText}>
                  Orari verificati da {selectedMosque.name}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.7 }]}
          onPress={saveAndSchedule}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={s.saveBtnText}>
                  {enabled ? 'Attiva notifiche' : 'Disattiva notifiche'}
                </Text>
              </>
          }
        </TouchableOpacity>

        <Text style={[s.note, { color: colors.textTertiary }]}>
          Le notifiche vengono pianificate per i prossimi 7 giorni e si aggiornano automaticamente ogni settimana.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '500' },
  warningCard: { flexDirection: 'row', gap: 10, borderRadius: 12, borderWidth: 0.5, padding: 12, marginBottom: 16 },
  warningTitle: { color: '#92400e', fontSize: 13, fontWeight: '500', marginBottom: 2 },
  warningText: { color: '#92400e', fontSize: 12, lineHeight: 17 },
  sectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  card: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowSub: { fontSize: 11, marginTop: 2 },
  minutesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14, paddingBottom: 8 },
  minBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.bg, borderWidth: 0.5, borderColor: c.border },
  minBtnActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder },
  minText: { fontSize: 13, color: c.textSecondary },
  hint: { fontSize: 11, paddingHorizontal: 14, paddingBottom: 12 },
  mosqueBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 0.5, marginTop: 8 },
  mosqueBannerText: { color: COLORS.primary, fontSize: 12, flex: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  note: { fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 12 },
});
