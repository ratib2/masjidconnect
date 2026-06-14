// src/screens/DuaScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, TextInput, Share, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, COLORS } from '../utils/theme';

const CATEGORIES = [
  { id: 'morning', label: 'Mattino', icon: 'sunny-outline', color: '#f59e0b' },
  { id: 'evening', label: 'Sera', icon: 'moon-outline', color: '#6366f1' },
  { id: 'prayer', label: 'Preghiera', icon: 'person-outline', color: '#0f6e56' },
  { id: 'food', label: 'Cibo', icon: 'restaurant-outline', color: '#ef4444' },
  { id: 'travel', label: 'Viaggio', icon: 'car-outline', color: '#3b82f6' },
  { id: 'sleep', label: 'Sonno', icon: 'bed-outline', color: '#8b5cf6' },
  { id: 'stress', label: 'Difficoltà', icon: 'heart-outline', color: '#ec4899' },
  { id: 'gratitude', label: 'Gratitudine', icon: 'gift-outline', color: '#10b981' },
];

const DUAS = [
  {
    id: '1', category: 'morning',
    title: 'Dua del mattino',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ',
    transliteration: "Asbahna wa asbahal mulku lillah, walhamdu lillah",
    translation: 'Siamo giunti al mattino e il regno appartiene ad Allah, e ogni lode appartiene ad Allah.',
    source: 'Abu Dawud 5077',
  },
  {
    id: '2', category: 'morning',
    title: 'Protezione del mattino',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
    transliteration: "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu wa ilaykan-nushur",
    translation: 'O Allah, con Te siamo giunti al mattino, con Te siamo giunti alla sera, con Te viviamo, con Te moriamo e a Te è il ritorno.',
    source: 'Abu Dawud 5068',
  },
  {
    id: '3', category: 'evening',
    title: 'Dua della sera',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ',
    transliteration: "Amsayna wa amsal mulku lillah, walhamdu lillah",
    translation: 'Siamo giunti alla sera e il regno appartiene ad Allah, e ogni lode appartiene ad Allah.',
    source: 'Muslim 2723',
  },
  {
    id: '4', category: 'prayer',
    title: 'Prima della preghiera',
    arabic: 'اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
    transliteration: "Allahummaj'alni minat-tawwabina waj'alni minal-mutatahhirin",
    translation: 'O Allah, rendimi tra coloro che si pentono e rendimi tra coloro che si purificano.',
    source: 'Tirmidhi 55',
  },
  {
    id: '5', category: 'prayer',
    title: 'Dopo la preghiera',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
    translation: "O Allah, aiutami a ricordarTi, a ringraziarTi e ad adorarTi nel migliore dei modi.",
    source: 'Abu Dawud 1522',
  },
  {
    id: '6', category: 'food',
    title: 'Prima di mangiare',
    arabic: 'بِسْمِ اللهِ',
    transliteration: "Bismillah",
    translation: 'Nel nome di Allah.',
    source: 'Bukhari 5376',
  },
  {
    id: '7', category: 'food',
    title: 'Dopo aver mangiato',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    translation: 'Lode ad Allah che mi ha dato da mangiare questo e me lo ha provvisto senza alcuna forza o potere da parte mia.',
    source: 'Abu Dawud 4023',
  },
  {
    id: '8', category: 'travel',
    title: 'Prima di viaggiare',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: "Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun",
    translation: 'Gloria a Colui che ha sottomesso questo per noi, e noi non saremmo stati capaci di farlo, e in verità al nostro Signore faremo ritorno.',
    source: 'Abu Dawud 2602',
  },
  {
    id: '9', category: 'sleep',
    title: 'Prima di dormire',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: "Bismika Allahumma amutu wa ahya",
    translation: 'Nel Tuo nome, o Allah, muoio e vivo.',
    source: 'Bukhari 6312',
  },
  {
    id: '10', category: 'sleep',
    title: 'Al risveglio',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    translation: 'Lode ad Allah che ci ha fatto vivere dopo averci fatto morire, e a Lui è la resurrezione.',
    source: 'Bukhari 6312',
  },
  {
    id: '11', category: 'stress',
    title: 'Nei momenti di difficoltà',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: "Hasbunallahu wa ni'mal wakil",
    translation: 'Allah ci è sufficiente, ed Egli è il migliore dei dispositori.',
    source: 'Al-Imran 3:173',
  },
  {
    id: '12', category: 'stress',
    title: 'Per la preoccupazione',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ',
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
    translation: "O Allah, cerco rifugio in Te dall'ansia e dalla tristezza.",
    source: 'Bukhari 6369',
  },
  {
    id: '13', category: 'gratitude',
    title: 'Ringraziamento',
    arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ كُلُّهُ',
    transliteration: "Allahumma lakal-hamdu kulluhu",
    translation: 'O Allah, a Te appartiene ogni lode.',
    source: 'Muslim 2696',
  },
  {
    id: '14', category: 'gratitude',
    title: 'Dua per la famiglia',
    arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqina imama",
    translation: 'Signor nostro, donaci dalle nostre spose e dalla nostra progenie la gioia degli occhi, e rendici un modello per i timorati.',
    source: 'Al-Furqan 25:74',
  },
];

export default function DuaScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = DUAS.filter((d) => {
    const matchCat = !selectedCategory || d.category === selectedCategory;
    const matchSearch = !search.trim() ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.translation.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const s = styles(colors);

  async function shareDua(dua) {
    await Share.share({
      message: `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}\n\nFonte: ${dua.source}\n\n— MasjidConnect`,
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Dua & Adhkar</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={[s.searchBar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            placeholder="Cerca dua..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categories} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <TouchableOpacity
          style={[s.catChip, !selectedCategory && s.catChipActive, { borderColor: !selectedCategory ? COLORS.primary : colors.border }]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[s.catText, !selectedCategory && { color: COLORS.primary }]}>Tutte</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catChip, selectedCategory === cat.id && s.catChipActive, { borderColor: selectedCategory === cat.id ? cat.color : colors.border }]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <Ionicons name={cat.icon} size={14} color={selectedCategory === cat.id ? cat.color : colors.textSecondary} />
            <Text style={[s.catText, selectedCategory === cat.id && { color: cat.color }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Duas list */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {filtered.map((dua) => {
          const isExpanded = expanded === dua.id;
          const cat = CATEGORIES.find((c) => c.id === dua.category);
          return (
            <TouchableOpacity
              key={dua.id}
              style={[s.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
              onPress={() => setExpanded(isExpanded ? null : dua.id)}
              activeOpacity={0.8}
            >
              <View style={s.cardHeader}>
                <View style={[s.catDot, { backgroundColor: cat?.color + '22' }]}>
                  <Ionicons name={cat?.icon || 'book-outline'} size={14} color={cat?.color || COLORS.primary} />
                </View>
                <Text style={[s.cardTitle, { color: colors.text }]}>{dua.title}</Text>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
              </View>

              {/* Arabic always visible */}
              <Text style={s.arabic}>{dua.arabic}</Text>

              {/* Expanded content */}
              {isExpanded && (
                <View style={s.expanded}>
                  <Text style={[s.transliteration, { color: colors.textSecondary }]}>{dua.transliteration}</Text>
                  <View style={[s.divider, { backgroundColor: colors.border }]} />
                  <Text style={[s.translation, { color: colors.text }]}>{dua.translation}</Text>
                  <View style={s.footer}>
                    <Text style={[s.source, { color: colors.textTertiary }]}>📖 {dua.source}</Text>
                    <TouchableOpacity onPress={() => shareDua(dua)} style={s.shareBtn}>
                      <Ionicons name="share-outline" size={16} color={COLORS.primary} />
                      <Text style={s.shareText}>Condividi</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '500' },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  categories: { maxHeight: 44, marginBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5, backgroundColor: 'transparent' },
  catChipActive: { backgroundColor: COLORS.primaryBg },
  catText: { fontSize: 12, color: '#666' },
  card: { borderRadius: 14, borderWidth: 0.5, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  catDot: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '500' },
  arabic: { fontSize: 20, textAlign: 'right', lineHeight: 36, color: COLORS.primary, fontWeight: '500' },
  expanded: { marginTop: 12 },
  transliteration: { fontSize: 13, fontStyle: 'italic', lineHeight: 20, marginBottom: 10 },
  divider: { height: 0.5, marginBottom: 10 },
  translation: { fontSize: 14, lineHeight: 22 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  source: { fontSize: 11 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shareText: { color: COLORS.primary, fontSize: 12 },
});
