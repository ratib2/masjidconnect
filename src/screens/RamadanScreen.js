// src/screens/RamadanScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';
import { calculatePrayerTimes } from '../utils/prayerTimes';

// Ramadan 2026 — approssimativo (inizia ~19 febbraio 2026)
const RAMADAN_2026_START = new Date(2026, 1, 19); // 19 Febbraio 2026
const RAMADAN_2026_END = new Date(2026, 2, 20);   // 20 Marzo 2026

// Ramadan 2027
const RAMADAN_2027_START = new Date(2027, 1, 8);
const RAMADAN_2027_END = new Date(2027, 2, 9);

function isRamadan(date) {
  return (date >= RAMADAN_2026_START && date <= RAMADAN_2026_END) ||
    (date >= RAMADAN_2027_START && date <= RAMADAN_2027_END);
}

function getRamadanInfo(date) {
  if (date >= RAMADAN_2026_START && date <= RAMADAN_2026_END) {
    const day = Math.floor((date - RAMADAN_2026_START) / 86400000) + 1;
    return { year: 1447, day, start: RAMADAN_2026_START, end: RAMADAN_2026_END };
  }
  if (date >= RAMADAN_2027_START && date <= RAMADAN_2027_END) {
    const day = Math.floor((date - RAMADAN_2027_START) / 86400000) + 1;
    return { year: 1448, day, start: RAMADAN_2027_START, end: RAMADAN_2027_END };
  }
  return null;
}

function getNextRamadan(date) {
  if (date < RAMADAN_2026_START) return { start: RAMADAN_2026_START, year: 1447 };
  if (date < RAMADAN_2027_START) return { start: RAMADAN_2027_START, year: 1448 };
  return null;
}

function countdown(from, to) {
  const diff = to - from;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes };
}

const DUAS_RAMADAN = [
  {
    arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِي رَجَبَ وَشَعْبَانَ وَبَلِّغْنَا رَمَضَانَ',
    trans: "Allahumma barik lana fi Rajaba wa Sha'bana wa ballighna Ramadan",
    it: 'O Allah, benedici per noi Rajab e Sha\'ban e facci raggiungere Ramadan.',
    occasion: 'Prima di Ramadan'
  },
  {
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    trans: "Allahumma innaka 'afuwwun karimun tuhibbul 'afwa fa'fu 'anni",
    it: "O Allah, Tu sei Perdonatore, Generoso, ami il perdono, quindi perdonami.",
    occasion: 'Laylat al-Qadr'
  },
  {
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى صِيَامِهِ وَقِيَامِهِ',
    trans: "Allahumma a'inni 'ala siyamihi wa qiyamihi",
    it: 'O Allah, aiutami nel suo digiuno e nella sua preghiera notturna.',
    occasion: 'Durante Ramadan'
  },
];

export default function RamadanScreen() {
  const { colors, isDark } = useTheme();
  const { location, calculationMethod } = useApp();
  const navigation = useNavigation();
  const [now, setNow] = useState(new Date());
  const [todayTimes, setTodayTimes] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location) {
      const times = calculatePrayerTimes(location.lat, location.lng, now, calculationMethod);
      setTodayTimes(times);
    }
  }, [location, calculationMethod]);

  const inRamadan = isRamadan(now);
  const ramadanInfo = getRamadanInfo(now);
  const nextRamadan = !inRamadan ? getNextRamadan(now) : null;
  const cd = nextRamadan ? countdown(now, nextRamadan.start) : null;

  const s = styles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.header, { backgroundColor: '#4c1d95' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ramadan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Countdown o giorno corrente */}
        {inRamadan && ramadanInfo ? (
          <View style={[s.mainCard, { backgroundColor: '#4c1d95' }]}>
            <Text style={s.mainLabel}>Ramadan {ramadanInfo.year} AH</Text>
            <Text style={s.mainDay}>Giorno {ramadanInfo.day}</Text>
            <Text style={s.mainSub}>Manca poco alla fine — persevera! 🌙</Text>
          </View>
        ) : nextRamadan && cd ? (
          <View style={[s.mainCard, { backgroundColor: '#4c1d95' }]}>
            <Text style={s.mainLabel}>Ramadan {nextRamadan.year} AH inizia il</Text>
            <Text style={s.mainDay}>{nextRamadan.start.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <View style={s.cdRow}>
              <View style={s.cdBox}>
                <Text style={s.cdNum}>{cd.days}</Text>
                <Text style={s.cdLabel}>giorni</Text>
              </View>
              <Text style={s.cdSep}>:</Text>
              <View style={s.cdBox}>
                <Text style={s.cdNum}>{cd.hours}</Text>
                <Text style={s.cdLabel}>ore</Text>
              </View>
              <Text style={s.cdSep}>:</Text>
              <View style={s.cdBox}>
                <Text style={s.cdNum}>{cd.minutes}</Text>
                <Text style={s.cdLabel}>min</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Suhoor / Iftar */}
        {todayTimes && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>OGGI</Text>
            <View style={s.timesRow}>
              <View style={[s.timeCard, { backgroundColor: '#1e1b4b', flex: 1 }]}>
                <Ionicons name="moon" size={20} color="#a5b4fc" />
                <Text style={s.timeCardLabel}>Suhoor</Text>
                <Text style={s.timeCardTime}>{todayTimes.fajr}</Text>
                <Text style={s.timeCardSub}>Fine del Suhoor (Fajr)</Text>
              </View>
              <View style={{ width: 10 }} />
              <View style={[s.timeCard, { backgroundColor: '#78350f', flex: 1 }]}>
                <Ionicons name="sunny" size={20} color="#fcd34d" />
                <Text style={s.timeCardLabel}>Iftar</Text>
                <Text style={s.timeCardTime}>{todayTimes.maghrib}</Text>
                <Text style={s.timeCardSub}>Rottura del digiuno (Maghrib)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Notti speciali */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>NOTTI SPECIALI</Text>
          {[
            { night: '21ª notte', desc: "Prima delle notti dispari — può essere Laylat al-Qadr" },
            { night: '23ª notte', desc: "Notte di grande valore spirituale" },
            { night: '25ª notte', desc: "Continua l'intensificazione dell'ibadah" },
            { night: '27ª notte', desc: "La notte più probabile di Laylat al-Qadr" },
            { night: '29ª notte', desc: "Ultima notte dispari di Ramadan" },
          ].map((item, i) => (
            <View key={i} style={[s.nightRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={s.nightIcon}>
                <Ionicons name="star" size={14} color="#f59e0b" />
              </View>
              <View>
                <Text style={[s.nightTitle, { color: colors.text }]}>{item.night}</Text>
                <Text style={[s.nightDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Dua Ramadan */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>DUA DI RAMADAN</Text>
          {DUAS_RAMADAN.map((dua, i) => (
            <View key={i} style={[s.duaCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Text style={[s.duaOccasion, { color: COLORS.primary }]}>{dua.occasion}</Text>
              <Text style={s.duaArabic}>{dua.arabic}</Text>
              <Text style={[s.duaTrans, { color: colors.textSecondary }]}>{dua.trans}</Text>
              <Text style={[s.duaIt, { color: colors.text }]}>{dua.it}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '500' },
  mainCard: { padding: 24, alignItems: 'center' },
  mainLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 6 },
  mainDay: { color: '#fff', fontSize: 28, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  mainSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  cdRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  cdBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  cdNum: { color: '#fff', fontSize: 28, fontWeight: '700' },
  cdLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  cdSep: { color: '#fff', fontSize: 24, fontWeight: '700' },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  timesRow: { flexDirection: 'row' },
  timeCard: { borderRadius: 14, padding: 16, alignItems: 'center', gap: 4 },
  timeCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  timeCardTime: { color: '#fff', fontSize: 26, fontWeight: '700' },
  timeCardSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textAlign: 'center' },
  nightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 0.5, marginBottom: 8 },
  nightIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  nightTitle: { fontSize: 14, fontWeight: '500' },
  nightDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  duaCard: { borderRadius: 14, borderWidth: 0.5, padding: 14, marginBottom: 10 },
  duaOccasion: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  duaArabic: { fontSize: 18, textAlign: 'right', lineHeight: 32, color: '#4c1d95', fontWeight: '500', marginBottom: 8 },
  duaTrans: { fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  duaIt: { fontSize: 13, lineHeight: 20 },
});
