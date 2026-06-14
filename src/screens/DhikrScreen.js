// src/screens/DhikrScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Vibration, StatusBar, Animated, Modal, TextInput, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, COLORS } from '../utils/theme';

const DEFAULT_DHIKR = [
  { id: '1', text: 'سُبْحَانَ اللهِ', transliteration: 'SubhanAllah', translation: 'Glory be to Allah', target: 33 },
  { id: '2', text: 'اَلْحَمْدُ للهِ', transliteration: 'Alhamdulillah', translation: 'Praise be to Allah', target: 33 },
  { id: '3', text: 'اَللهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'Allah is the Greatest', target: 34 },
  { id: '4', text: 'لَا إِلَهَ إِلَّا اللهُ', transliteration: 'La ilaha illallah', translation: 'There is no god but Allah', target: 100 },
  { id: '5', text: 'أَسْتَغْفِرُ اللهَ', transliteration: 'Astaghfirullah', translation: 'I seek forgiveness from Allah', target: 100 },
  { id: '6', text: 'صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ', transliteration: 'Sallallahu alayhi wasallam', translation: 'May Allah bless him and grant him peace', target: 100 },
];

export default function DhikrScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState(DEFAULT_DHIKR[0]);
  const [count, setCount] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [sessions, setSessions] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [vibrate, setVibrate] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const today = new Date().toDateString();
    const saved = sessions[`${today}_${selected.id}`] || 0;
    setCount(saved);
  }, [selected, sessions]);

  useEffect(() => {
    const target = selected.target;
    Animated.timing(progressAnim, {
      toValue: Math.min(count / target, 1),
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [count, selected]);

  async function loadSessions() {
    try {
      const raw = await AsyncStorage.getItem('dhikr_sessions');
      if (raw) setSessions(JSON.parse(raw));
      const todayRaw = await AsyncStorage.getItem('dhikr_today');
      if (todayRaw) {
        const { date, total } = JSON.parse(todayRaw);
        if (date === new Date().toDateString()) setTotalToday(total);
      }
    } catch (_) {}
  }

  async function saveCount(newCount) {
    const today = new Date().toDateString();
    const key = `${today}_${selected.id}`;
    const newSessions = { ...sessions, [key]: newCount };
    setSessions(newSessions);
    await AsyncStorage.setItem('dhikr_sessions', JSON.stringify(newSessions));
  }

  async function saveTotalToday(newTotal) {
    setTotalToday(newTotal);
    await AsyncStorage.setItem('dhikr_today', JSON.stringify({
      date: new Date().toDateString(),
      total: newTotal,
    }));
  }

  function handleTap() {
    const newCount = count + 1;
    setCount(newCount);
    saveTotalToday(totalToday + 1);
    saveCount(newCount);

    if (vibrate) Vibration.vibrate(30);

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();

    // Completion haptic
    if (newCount === selected.target) {
      Vibration.vibrate([0, 80, 60, 80]);
    }
  }

  function handleReset() {
    Alert.alert('Reset', 'Reset counter to zero?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { setCount(0); saveCount(0); } },
    ]);
  }

  const progress = Math.min(count / selected.target, 1);
  const completed = Math.floor(count / selected.target);
  const remainder = count % selected.target;
  const CIRCLE_R = 100;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

  const s = styles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <Text style={s.headerTitle}>Dhikr</Text>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn} onPress={() => setVibrate((v) => !v)}>
            <Ionicons name={vibrate ? 'phone-portrait' : 'phone-portrait-outline'} size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={handleReset}>
            <Ionicons name="refresh" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Today stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: colors.bgSecondary }]}>
            <Text style={s.statNum}>{totalToday}</Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Today total</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.bgSecondary }]}>
            <Text style={s.statNum}>{completed}</Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Sets done</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.bgSecondary }]}>
            <Text style={s.statNum}>{selected.target - remainder}</Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
          </View>
        </View>

        {/* Dhikr selector */}
        <TouchableOpacity style={[s.dhikrSelector, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]} onPress={() => setShowPicker(true)}>
          <View style={{ flex: 1 }}>
            <Text style={[s.dhikrArabic, { color: colors.text }]}>{selected.text}</Text>
            <Text style={[s.dhikrLatin, { color: colors.textSecondary }]}>{selected.transliteration}</Text>
          </View>
          <View style={s.targetBadge}>
            <Text style={s.targetText}>×{selected.target}</Text>
          </View>
          <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Circle counter */}
        <View style={s.circleWrap}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity onPress={handleTap} activeOpacity={0.85}>
              <View style={s.circleOuter}>
                {/* SVG-like progress ring using border trick */}
                <View style={[s.circleRing, { borderColor: colors.border }]}>
                  <View style={[s.circleProgress, {
                    borderColor: progress >= 1 ? '#1d9e75' : COLORS.primary,
                    opacity: progress > 0 ? 1 : 0.15,
                  }]} />
                </View>
                <View style={[s.circleInner, { backgroundColor: COLORS.primary }]}>
                  <Text style={s.countNum}>{remainder}</Text>
                  <Text style={s.countTarget}>/ {selected.target}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
          <Text style={[s.tapHint, { color: colors.textTertiary }]}>Tap to count</Text>
        </View>

        {/* Translation */}
        <View style={[s.translationCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[s.translationText, { color: colors.textSecondary }]}>{selected.translation}</Text>
        </View>
      </ScrollView>

      {/* Dhikr picker modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Choose Dhikr</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {DEFAULT_DHIKR.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[s.pickerRow, { borderBottomColor: colors.border }, selected.id === item.id && { backgroundColor: COLORS.primaryBg }]}
                onPress={() => { setSelected(item); setShowPicker(false); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.pickerArabic, { color: colors.text }]}>{item.text}</Text>
                  <Text style={[s.pickerLatin, { color: colors.textSecondary }]}>{item.transliteration}</Text>
                </View>
                <View style={[s.pickerTarget, { backgroundColor: colors.bgSecondary }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>×{item.target}</Text>
                </View>
                {selected.id === item.id && <Ionicons name="checkmark" size={16} color={COLORS.primary} style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '500' },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', gap: 10, padding: 20, paddingBottom: 0 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '500', color: COLORS.primary },
  statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },

  dhikrSelector: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 20, marginBottom: 0, borderRadius: 14, padding: 14, borderWidth: 0.5 },
  dhikrArabic: { fontSize: 18, fontWeight: '500', textAlign: 'right' },
  dhikrLatin: { fontSize: 12, marginTop: 2 },
  targetBadge: { backgroundColor: COLORS.primaryBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  targetText: { color: COLORS.primary, fontSize: 12, fontWeight: '500' },

  circleWrap: { alignItems: 'center', paddingVertical: 32 },
  circleOuter: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  circleRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 8 },
  circleProgress: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 8, borderLeftColor: 'transparent', borderBottomColor: 'transparent' },
  circleInner: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center' },
  countNum: { color: '#fff', fontSize: 56, fontWeight: '500', lineHeight: 60 },
  countTarget: { color: 'rgba(255,255,255,0.65)', fontSize: 14 },
  tapHint: { fontSize: 12, marginTop: 12 },

  translationCard: { marginHorizontal: 20, borderRadius: 12, padding: 14, borderWidth: 0.5, alignItems: 'center' },
  translationText: { fontSize: 14, textAlign: 'center', fontStyle: 'italic' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 0.5 },
  modalTitle: { fontSize: 18, fontWeight: '500' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  pickerArabic: { fontSize: 16, fontWeight: '500', textAlign: 'right' },
  pickerLatin: { fontSize: 12, marginTop: 2 },
  pickerTarget: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
});
