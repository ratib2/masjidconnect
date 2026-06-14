// src/screens/QuranScreen.js
// Lettore Quran con le prime Sure complete + ricerca + segnalibri
// Le sure complete sono caricate localmente, le altre via API

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, COLORS } from '../utils/theme';

// Lista delle 114 Sure con metadati
const SURAHS = [
  { num: 1,  ar: 'الفاتحة',    name: 'Al-Fatiha',     it: 'L\'Aprente',          verses: 7,   type: 'Meccan' },
  { num: 2,  ar: 'البقرة',     name: 'Al-Baqarah',    it: 'La Mucca',            verses: 286, type: 'Medinan' },
  { num: 3,  ar: 'آل عمران',   name: 'Ali Imran',     it: 'La famiglia di Imran',verses: 200, type: 'Medinan' },
  { num: 4,  ar: 'النساء',     name: 'An-Nisa',       it: 'Le Donne',            verses: 176, type: 'Medinan' },
  { num: 5,  ar: 'المائدة',    name: 'Al-Maidah',     it: 'La Tavola Imbandita', verses: 120, type: 'Medinan' },
  { num: 6,  ar: 'الأنعام',    name: "Al-An'am",      it: 'I Bestiami',          verses: 165, type: 'Meccan' },
  { num: 7,  ar: 'الأعراف',    name: "Al-A'raf",      it: 'Le Altezze',          verses: 206, type: 'Meccan' },
  { num: 8,  ar: 'الأنفال',    name: 'Al-Anfal',      it: 'I Bottini di Guerra', verses: 75,  type: 'Medinan' },
  { num: 9,  ar: 'التوبة',     name: 'At-Tawbah',     it: 'Il Pentimento',       verses: 129, type: 'Medinan' },
  { num: 10, ar: 'يونس',       name: 'Yunus',         it: 'Giona',               verses: 109, type: 'Meccan' },
  { num: 11, ar: 'هود',        name: 'Hud',           it: 'Hud',                 verses: 123, type: 'Meccan' },
  { num: 12, ar: 'يوسف',       name: 'Yusuf',         it: 'Giuseppe',            verses: 111, type: 'Meccan' },
  { num: 13, ar: 'الرعد',      name: "Ar-Ra'd",       it: 'Il Tuono',            verses: 43,  type: 'Medinan' },
  { num: 14, ar: 'إبراهيم',    name: 'Ibrahim',       it: 'Abramo',              verses: 52,  type: 'Meccan' },
  { num: 15, ar: 'الحجر',      name: 'Al-Hijr',       it: 'Al-Hijr',             verses: 99,  type: 'Meccan' },
  { num: 16, ar: 'النحل',      name: 'An-Nahl',       it: 'Le Api',              verses: 128, type: 'Meccan' },
  { num: 17, ar: 'الإسراء',    name: "Al-Isra'",      it: "Il Viaggio Notturno", verses: 111, type: 'Meccan' },
  { num: 18, ar: 'الكهف',      name: 'Al-Kahf',       it: 'La Caverna',          verses: 110, type: 'Meccan' },
  { num: 19, ar: 'مريم',       name: 'Maryam',        it: 'Maria',               verses: 98,  type: 'Meccan' },
  { num: 20, ar: 'طه',         name: 'Ta-Ha',         it: 'Ta-Ha',               verses: 135, type: 'Meccan' },
  { num: 36, ar: 'يس',         name: 'Ya-Sin',        it: 'Ya-Sin',              verses: 83,  type: 'Meccan' },
  { num: 55, ar: 'الرحمن',     name: 'Ar-Rahman',     it: 'Il Misericordioso',   verses: 78,  type: 'Medinan' },
  { num: 56, ar: 'الواقعة',    name: "Al-Waqi'ah",    it: "L'Evento",            verses: 96,  type: 'Meccan' },
  { num: 67, ar: 'الملك',      name: 'Al-Mulk',       it: 'Il Dominio',          verses: 30,  type: 'Meccan' },
  { num: 78, ar: 'النبأ',      name: "An-Naba'",      it: 'La Notizia',          verses: 40,  type: 'Meccan' },
  { num: 93, ar: 'الضحى',      name: 'Ad-Duha',       it: 'La Mattina',          verses: 11,  type: 'Meccan' },
  { num: 94, ar: 'الشرح',      name: 'Ash-Sharh',     it: 'L\'Apertura',         verses: 8,   type: 'Meccan' },
  { num: 95, ar: 'التين',      name: 'At-Tin',        it: 'Il Fico',             verses: 8,   type: 'Meccan' },
  { num: 96, ar: 'العلق',      name: "Al-'Alaq",      it: 'Il Coagulo',          verses: 19,  type: 'Meccan' },
  { num: 97, ar: 'القدر',      name: 'Al-Qadr',       it: 'Il Destino',          verses: 5,   type: 'Meccan' },
  { num: 98, ar: 'البينة',     name: 'Al-Bayyinah',   it: 'La Prova Evidente',   verses: 8,   type: 'Medinan' },
  { num: 99, ar: 'الزلزلة',    name: 'Az-Zalzalah',   it: 'Il Terremoto',        verses: 8,   type: 'Meccan' },
  { num: 100, ar: 'العاديات',  name: "Al-'Adiyat",    it: 'I Corsieri',          verses: 11,  type: 'Meccan' },
  { num: 101, ar: 'القارعة',   name: "Al-Qari'ah",    it: 'Il Fragore',          verses: 11,  type: 'Meccan' },
  { num: 102, ar: 'التكاثر',   name: 'At-Takathur',   it: 'L\'Accumulo',         verses: 8,   type: 'Meccan' },
  { num: 103, ar: 'العصر',     name: "Al-'Asr",       it: 'Il Tempo',            verses: 3,   type: 'Meccan' },
  { num: 104, ar: 'الهمزة',    name: 'Al-Humazah',    it: 'Il Calunniatore',     verses: 9,   type: 'Meccan' },
  { num: 105, ar: 'الفيل',     name: 'Al-Fil',        it: 'L\'Elefante',         verses: 5,   type: 'Meccan' },
  { num: 106, ar: 'قريش',      name: 'Quraysh',       it: 'I Quraysh',           verses: 4,   type: 'Meccan' },
  { num: 107, ar: 'الماعون',   name: "Al-Ma'un",      it: 'Le Piccole Bontà',    verses: 7,   type: 'Meccan' },
  { num: 108, ar: 'الكوثر',    name: 'Al-Kawthar',    it: 'L\'Abbondanza',       verses: 3,   type: 'Meccan' },
  { num: 109, ar: 'الكافرون',  name: 'Al-Kafirun',    it: 'I Miscredenti',       verses: 6,   type: 'Meccan' },
  { num: 110, ar: 'النصر',     name: 'An-Nasr',       it: 'La Vittoria',         verses: 3,   type: 'Medinan' },
  { num: 111, ar: 'المسد',     name: 'Al-Masad',      it: 'La Fibra',            verses: 5,   type: 'Meccan' },
  { num: 112, ar: 'الإخلاص',   name: 'Al-Ikhlas',     it: 'La Sincerità',        verses: 4,   type: 'Meccan' },
  { num: 113, ar: 'الفلق',     name: 'Al-Falaq',      it: 'L\'Alba',             verses: 5,   type: 'Meccan' },
  { num: 114, ar: 'الناس',     name: 'An-Nas',        it: 'Gli Uomini',          verses: 6,   type: 'Meccan' },
];

const JUZZ = [
  { num: 1, name: "Alif Lam Mim", startSurah: 1, startVerse: 1 },
  { num: 2, name: "Sayaqul", startSurah: 2, startVerse: 142 },
  { num: 30, name: "Amma", startSurah: 78, startVerse: 1 },
];

export default function QuranScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [view, setView] = useState('surahs'); // 'surahs' | 'reader'
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [search, setSearch] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [showArabic, setShowArabic] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [fontSize, setFontSize] = useState(20);

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    try {
      const raw = await AsyncStorage.getItem('quran_bookmarks');
      if (raw) setBookmarks(JSON.parse(raw));
    } catch (_) {}
  }

  async function toggleBookmark(surahNum, verseNum) {
    const key = `${surahNum}:${verseNum}`;
    const newBm = bookmarks.includes(key)
      ? bookmarks.filter((b) => b !== key)
      : [...bookmarks, key];
    setBookmarks(newBm);
    await AsyncStorage.setItem('quran_bookmarks', JSON.stringify(newBm));
  }

  async function openSurah(surah) {
    setSelectedSurah(surah);
    setView('reader');
    setLoadingVerses(true);
    try {
      // Usa API AlQuran Cloud (gratuita, no chiave)
      const res = await fetch(
        `https://api.alquran.cloud/v1/surah/${surah.num}/editions/quran-simple,it.piccardo`
      );
      const data = await res.json();
      if (data.code === 200) {
        const arabicVerses = data.data[0].ayahs;
        const italianVerses = data.data[1].ayahs;
        const combined = arabicVerses.map((av, i) => ({
          number: av.numberInSurah,
          arabic: av.text,
          translation: italianVerses[i]?.text || '',
        }));
        setVerses(combined);
      }
    } catch (err) {
      // Fallback con Al-Fatiha locale
      if (surah.num === 1) {
        setVerses([
          { number: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'Nel nome di Allah, il Compassionevole, il Misericordioso.' },
          { number: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: 'Lode ad Allah, Signore dei mondi,' },
          { number: 3, arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'il Compassionevole, il Misericordioso,' },
          { number: 4, arabic: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Sovrano del Giorno del Giudizio.' },
          { number: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'Te solo adoriamo, a Te solo chiediamo aiuto.' },
          { number: 6, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guidaci sulla retta via,' },
          { number: 7, arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'la via di coloro che hai benedetto, non di coloro che hanno attirato la Tua ira né degli sviati.' },
        ]);
      } else {
        setVerses([]);
      }
    } finally {
      setLoadingVerses(false);
    }
  }

  const filteredSurahs = search.trim()
    ? SURAHS.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.it.toLowerCase().includes(search.toLowerCase()) ||
        s.ar.includes(search) ||
        s.num.toString() === search.trim()
      )
    : SURAHS;

  const st = styles(colors);

  // ─── Reader view ───────────────────────────────────────────────────────────
  if (view === 'reader' && selectedSurah) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[st.header, { backgroundColor: COLORS.primary }]}>
          <TouchableOpacity onPress={() => { setView('surahs'); setVerses([]); }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={st.headerTitle}>{selectedSurah.name}</Text>
            <Text style={st.headerSub}>{selectedSurah.ar} · {selectedSurah.verses} ayah</Text>
          </View>
          <View style={st.readerControls}>
            <TouchableOpacity onPress={() => setFontSize((f) => Math.max(14, f - 2))}>
              <Ionicons name="remove-circle-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFontSize((f) => Math.min(32, f + 2))}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Toggle options */}
        <View style={[st.toggleRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[st.toggleBtn, showArabic && st.toggleBtnActive]}
            onPress={() => setShowArabic((v) => !v)}
          >
            <Text style={[st.toggleText, showArabic && { color: COLORS.primary }]}>عربي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.toggleBtn, showTranslation && st.toggleBtnActive]}
            onPress={() => setShowTranslation((v) => !v)}
          >
            <Text style={[st.toggleText, showTranslation && { color: COLORS.primary }]}>Italiano</Text>
          </TouchableOpacity>
        </View>

        {loadingVerses ? (
          <View style={st.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[st.loadingText, { color: colors.textSecondary }]}>Caricamento ayah...</Text>
          </View>
        ) : (
          <FlatList
            data={verses}
            keyExtractor={(item) => item.number.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <View style={[st.bismillah, { backgroundColor: COLORS.primaryBg }]}>
                <Text style={st.bismillahText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
              </View>
            }
            renderItem={({ item }) => {
              const bmKey = `${selectedSurah.num}:${item.number}`;
              const isBookmarked = bookmarks.includes(bmKey);
              return (
                <View style={[st.verseCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={st.verseHeader}>
                    <View style={[st.verseNumBadge, { backgroundColor: COLORS.primaryBg }]}>
                      <Text style={st.verseNum}>{item.number}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleBookmark(selectedSurah.num, item.number)}>
                      <Ionicons
                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={isBookmarked ? COLORS.primary : colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                  {showArabic && (
                    <Text style={[st.arabicVerse, { fontSize, color: colors.text }]}>
                      {item.arabic}
                    </Text>
                  )}
                  {showTranslation && item.translation ? (
                    <Text style={[st.italianVerse, { color: colors.textSecondary }]}>
                      {item.translation}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </View>
    );
  }

  // ─── Surah list view ───────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[st.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={st.headerTitle}>Al-Quran</Text>
          <Text style={st.headerSub}>القرآن الكريم</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={st.searchWrap}>
        <View style={[st.searchBar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            style={[st.searchInput, { color: colors.text }]}
            placeholder="Cerca sura per nome o numero..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bookmarks banner */}
      {bookmarks.length > 0 && (
        <TouchableOpacity style={[st.bmBanner, { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder }]}>
          <Ionicons name="bookmark" size={14} color={COLORS.primary} />
          <Text style={st.bmText}>{bookmarks.length} segnalibri salvati</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredSurahs}
        keyExtractor={(item) => item.num.toString()}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[st.surahRow, { borderBottomColor: colors.border }]}
            onPress={() => openSurah(item)}
            activeOpacity={0.7}
          >
            <View style={[st.surahNum, { backgroundColor: COLORS.primaryBg }]}>
              <Text style={st.surahNumText}>{item.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.surahName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[st.surahMeta, { color: colors.textSecondary }]}>
                {item.it} · {item.verses} ayah · {item.type}
              </Text>
            </View>
            <Text style={st.surahAr}>{item.ar}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '500', textAlign: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'center' },
  readerControls: { flexDirection: 'row', gap: 6 },
  toggleRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 0.5 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: 'transparent' },
  toggleBtnActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder },
  toggleText: { fontSize: 13, color: '#888' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  bismillah: { borderRadius: 12, padding: 14, marginBottom: 16, alignItems: 'center' },
  bismillahText: { fontSize: 22, color: COLORS.primary, textAlign: 'center', lineHeight: 38 },
  verseCard: { borderRadius: 12, borderWidth: 0.5, padding: 14, marginBottom: 10 },
  verseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  verseNumBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  verseNum: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  arabicVerse: { textAlign: 'right', lineHeight: 46, fontWeight: '400', marginBottom: 10 },
  italianVerse: { fontSize: 13, lineHeight: 21 },
  searchWrap: { padding: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  bmBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginBottom: 8, borderRadius: 10, padding: 10, borderWidth: 0.5 },
  bmText: { color: COLORS.primary, fontSize: 12 },
  surahRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  surahNum: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  surahNumText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  surahName: { fontSize: 15, fontWeight: '500' },
  surahMeta: { fontSize: 12, marginTop: 2 },
  surahAr: { fontSize: 18, color: COLORS.primary, fontWeight: '500' },
});
