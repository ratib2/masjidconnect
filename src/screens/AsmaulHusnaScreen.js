// src/screens/AsmaulHusnaScreen.js
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, COLORS } from '../utils/theme';

const NAMES = [
  { num: 1,  ar: 'الرَّحْمَنُ',  trans: 'Ar-Rahman',     it: 'Il Compassionevole',    en: 'The Most Gracious' },
  { num: 2,  ar: 'الرَّحِيمُ',  trans: 'Ar-Rahim',      it: 'Il Misericordioso',     en: 'The Most Merciful' },
  { num: 3,  ar: 'الْمَلِكُ',   trans: 'Al-Malik',      it: 'Il Re',                 en: 'The King' },
  { num: 4,  ar: 'الْقُدُّوسُ', trans: 'Al-Quddus',     it: 'Il Santissimo',         en: 'The Most Holy' },
  { num: 5,  ar: 'السَّلَامُ',  trans: 'As-Salam',      it: 'La Pace',               en: 'The Source of Peace' },
  { num: 6,  ar: 'الْمُؤْمِنُ', trans: "Al-Mu'min",     it: 'Il Garante',            en: 'The Guardian of Faith' },
  { num: 7,  ar: 'الْمُهَيْمِنُ',trans: 'Al-Muhaymin',  it: 'Il Custode',            en: 'The Protector' },
  { num: 8,  ar: 'الْعَزِيزُ',  trans: "Al-'Aziz",      it: 'Il Potente',            en: 'The Almighty' },
  { num: 9,  ar: 'الْجَبَّارُ', trans: 'Al-Jabbar',     it: 'Il Compulsore',         en: 'The Compeller' },
  { num: 10, ar: 'الْمُتَكَبِّرُ',trans: 'Al-Mutakabbir',it: 'Il Superbo',           en: 'The Majestic' },
  { num: 11, ar: 'الْخَالِقُ',  trans: 'Al-Khaliq',     it: 'Il Creatore',           en: 'The Creator' },
  { num: 12, ar: 'الْبَارِئُ',  trans: "Al-Bari'",      it: "L'Originatore",         en: 'The Originator' },
  { num: 13, ar: 'الْمُصَوِّرُ',trans: 'Al-Musawwir',   it: 'Il Formatore',          en: 'The Shaper' },
  { num: 14, ar: 'الْغَفَّارُ', trans: 'Al-Ghaffar',    it: 'Il Perdonatore',        en: 'The Forgiving' },
  { num: 15, ar: 'الْقَهَّارُ', trans: 'Al-Qahhar',     it: 'Il Dominante',          en: 'The Subduer' },
  { num: 16, ar: 'الْوَهَّابُ', trans: 'Al-Wahhab',     it: 'Il Donatore',           en: 'The Bestower' },
  { num: 17, ar: 'الرَّزَّاقُ', trans: 'Ar-Razzaq',     it: 'Il Provveditore',       en: 'The Provider' },
  { num: 18, ar: 'الْفَتَّاحُ', trans: 'Al-Fattah',     it: 'Il Dischiudente',       en: 'The Opener' },
  { num: 19, ar: 'الْعَلِيمُ',  trans: "Al-'Alim",      it: "L'Onnisciente",         en: 'The All-Knowing' },
  { num: 20, ar: 'الْقَابِضُ',  trans: 'Al-Qabid',      it: 'Il Contraente',         en: 'The Withholder' },
  { num: 21, ar: 'الْبَاسِطُ',  trans: 'Al-Basit',      it: "L'Espansore",           en: 'The Extender' },
  { num: 22, ar: 'الْخَافِضُ',  trans: 'Al-Khafid',     it: 'L\'Abbassatore',        en: 'The Abaser' },
  { num: 23, ar: 'الرَّافِعُ',  trans: "Ar-Rafi'",      it: "L'Elevatore",           en: 'The Exalter' },
  { num: 24, ar: 'الْمُعِزُّ',  trans: "Al-Mu'izz",     it: "L'Onorevole",           en: 'The Honourer' },
  { num: 25, ar: 'الْمُذِلُّ',  trans: 'Al-Mudhil',     it: 'L\'Umiliatore',         en: 'The Dishonorer' },
  { num: 26, ar: 'السَّمِيعُ',  trans: "As-Sami'",      it: "L'Udente",              en: 'The All-Hearing' },
  { num: 27, ar: 'الْبَصِيرُ',  trans: 'Al-Basir',      it: 'Il Veggente',           en: 'The All-Seeing' },
  { num: 28, ar: 'الْحَكَمُ',   trans: 'Al-Hakam',      it: 'Il Giudice',            en: 'The Judge' },
  { num: 29, ar: 'الْعَدْلُ',   trans: "Al-'Adl",       it: 'Il Giusto',             en: 'The Just' },
  { num: 30, ar: 'اللَّطِيفُ',  trans: 'Al-Latif',      it: 'Il Sottile',            en: 'The Subtle' },
  { num: 31, ar: 'الْخَبِيرُ',  trans: 'Al-Khabir',     it: "L'Informato",           en: 'The All-Aware' },
  { num: 32, ar: 'الْحَلِيمُ',  trans: 'Al-Halim',      it: 'Il Clemente',           en: 'The Forbearing' },
  { num: 33, ar: 'الْعَظِيمُ',  trans: "Al-'Azim",      it: 'Il Grande',             en: 'The Magnificent' },
  { num: 34, ar: 'الْغَفُورُ',  trans: 'Al-Ghafur',     it: 'Il Molto Perdonante',   en: 'The Forgiving' },
  { num: 35, ar: 'الشَّكُورُ',  trans: 'Ash-Shakur',    it: 'Il Riconoscente',       en: 'The Appreciative' },
  { num: 36, ar: 'الْعَلِيُّ',  trans: "Al-'Ali",       it: "L'Altissimo",           en: 'The Most High' },
  { num: 37, ar: 'الْكَبِيرُ',  trans: 'Al-Kabir',      it: 'Il Grande',             en: 'The Grand' },
  { num: 38, ar: 'الْحَفِيظُ',  trans: 'Al-Hafiz',      it: 'Il Custode',            en: 'The Preserver' },
  { num: 39, ar: 'الْمُقِيتُ',  trans: 'Al-Muqit',      it: 'Il Nutritore',          en: 'The Sustainer' },
  { num: 40, ar: 'الْحَسِيبُ',  trans: 'Al-Hasib',      it: 'Il Computatore',        en: 'The Reckoner' },
  { num: 41, ar: 'الْجَلِيلُ',  trans: 'Al-Jalil',      it: 'Il Maestoso',           en: 'The Majestic' },
  { num: 42, ar: 'الْكَرِيمُ',  trans: 'Al-Karim',      it: 'Il Generoso',           en: 'The Generous' },
  { num: 43, ar: 'الرَّقِيبُ',  trans: 'Ar-Raqib',      it: 'Il Vigilante',          en: 'The Watchful' },
  { num: 44, ar: 'الْمُجِيبُ',  trans: 'Al-Mujib',      it: 'Il Rispondente',        en: 'The Responsive' },
  { num: 45, ar: 'الْوَاسِعُ',  trans: "Al-Wasi'",      it: "L'Illimitato",          en: 'The All-Encompassing' },
  { num: 46, ar: 'الْحَكِيمُ',  trans: 'Al-Hakim',      it: 'Il Saggio',             en: 'The Wise' },
  { num: 47, ar: 'الْوَدُودُ',  trans: 'Al-Wadud',      it: 'L\'Amorevole',          en: 'The Loving' },
  { num: 48, ar: 'الْمَجِيدُ',  trans: 'Al-Majid',      it: 'Il Glorioso',           en: 'The Glorious' },
  { num: 49, ar: 'الْبَاعِثُ',  trans: "Al-Ba'ith",     it: 'Il Risuscitatore',      en: 'The Resurrector' },
  { num: 50, ar: 'الشَّهِيدُ',  trans: 'Ash-Shahid',    it: 'Il Testimone',          en: 'The Witness' },
  { num: 51, ar: 'الْحَقُّ',    trans: 'Al-Haqq',       it: 'La Verità',             en: 'The Truth' },
  { num: 52, ar: 'الْوَكِيلُ',  trans: 'Al-Wakil',      it: 'Il Fidato',             en: 'The Trustee' },
  { num: 53, ar: 'الْقَوِيُّ',  trans: 'Al-Qawi',       it: 'Il Potente',            en: 'The Strong' },
  { num: 54, ar: 'الْمَتِينُ',  trans: 'Al-Matin',      it: 'Il Saldo',              en: 'The Firm' },
  { num: 55, ar: 'الْوَلِيُّ',  trans: 'Al-Wali',       it: "L'Alleato",             en: 'The Protecting Friend' },
  { num: 56, ar: 'الْحَمِيدُ',  trans: 'Al-Hamid',      it: 'Il Lodevole',           en: 'The Praiseworthy' },
  { num: 57, ar: 'الْمُحْصِي',  trans: 'Al-Muhsi',      it: 'Il Computatore',        en: 'The Accounter' },
  { num: 58, ar: 'الْمُبْدِئُ', trans: "Al-Mubdi'",     it: "L'Iniziatore",          en: 'The Originator' },
  { num: 59, ar: 'الْمُعِيدُ',  trans: "Al-Mu'id",      it: 'Il Ripristinatore',     en: 'The Restorer' },
  { num: 60, ar: 'الْمُحْيِي',  trans: 'Al-Muhyi',      it: 'Il Vivificatore',       en: 'The Giver of Life' },
  { num: 61, ar: 'الْمُمِيتُ',  trans: 'Al-Mumit',      it: 'Il Datore di Morte',    en: 'The Taker of Life' },
  { num: 62, ar: 'الْحَيُّ',    trans: 'Al-Hayy',       it: 'Il Vivente',            en: 'The Ever-Living' },
  { num: 63, ar: 'الْقَيُّومُ', trans: 'Al-Qayyum',     it: "L'Autosussistente",     en: 'The Self-Subsisting' },
  { num: 64, ar: 'الْوَاجِدُ',  trans: 'Al-Wajid',      it: 'Il Trovante',           en: 'The Finder' },
  { num: 65, ar: 'الْمَاجِدُ',  trans: 'Al-Majid',      it: 'Il Nobile',             en: 'The Noble' },
  { num: 66, ar: 'الْوَاحِدُ',  trans: 'Al-Wahid',      it: "L'Unico",               en: 'The One' },
  { num: 67, ar: 'الْأَحَدُ',   trans: 'Al-Ahad',       it: "L'Unico",               en: 'The Unique' },
  { num: 68, ar: 'الصَّمَدُ',   trans: 'As-Samad',      it: "L'Eterno",              en: 'The Eternal' },
  { num: 69, ar: 'الْقَادِرُ',  trans: 'Al-Qadir',      it: "L'Onnipotente",         en: 'The Capable' },
  { num: 70, ar: 'الْمُقْتَدِرُ',trans: 'Al-Muqtadir',  it: 'Il Potentissimo',       en: 'The Powerful' },
  { num: 71, ar: 'الْمُقَدِّمُ',trans: 'Al-Muqaddim',   it: 'L\'Anticipatore',       en: 'The Expediter' },
  { num: 72, ar: 'الْمُؤَخِّرُ',trans: "Al-Mu'akhkhir", it: 'Il Ritardante',         en: 'The Delayer' },
  { num: 73, ar: 'الْأَوَّلُ',  trans: 'Al-Awwal',      it: 'Il Primo',              en: 'The First' },
  { num: 74, ar: 'الْآخِرُ',   trans: 'Al-Akhir',      it: "L'Ultimo",              en: 'The Last' },
  { num: 75, ar: 'الظَّاهِرُ',  trans: 'Az-Zahir',      it: 'Il Manifesto',          en: 'The Manifest' },
  { num: 76, ar: 'الْبَاطِنُ',  trans: 'Al-Batin',      it: "L'Occulto",             en: 'The Hidden' },
  { num: 77, ar: 'الْوَالِي',   trans: 'Al-Wali',       it: 'Il Governatore',        en: 'The Governor' },
  { num: 78, ar: 'الْمُتَعَالِ',trans: "Al-Muta'ali",   it: 'L\'Altissimo',          en: 'The Most Exalted' },
  { num: 79, ar: 'الْبَرُّ',    trans: 'Al-Barr',       it: 'Il Benevolo',           en: 'The Source of Goodness' },
  { num: 80, ar: 'التَّوَّابُ', trans: 'At-Tawwab',     it: 'L\'Accettante del Pentimento', en: 'The Acceptor of Repentance' },
  { num: 81, ar: 'الْمُنْتَقِمُ',trans: 'Al-Muntaqim',  it: 'Il Vendicatore',        en: 'The Avenger' },
  { num: 82, ar: 'الْعَفُوُّ',  trans: "Al-'Afuww",     it: 'Il Perdonatore',        en: 'The Pardoner' },
  { num: 83, ar: 'الرَّؤُوفُ',  trans: "Ar-Ra'uf",      it: 'Il Clementissimo',      en: 'The Most Kind' },
  { num: 84, ar: 'مَالِكُ الْمُلْكِ', trans: 'Malik al-Mulk', it: 'Il Possessore del regno', en: 'Owner of Sovereignty' },
  { num: 85, ar: 'ذُو الْجَلَالِ وَالْإِكْرَامِ', trans: "Dhul-Jalali wal-Ikram", it: 'Signore della Maestà e Generosità', en: 'Lord of Majesty and Bounty' },
  { num: 86, ar: 'الْمُقْسِطُ', trans: 'Al-Muqsit',     it: 'L\'Equo',               en: 'The Equitable' },
  { num: 87, ar: 'الْجَامِعُ',  trans: "Al-Jami'",      it: 'Il Raccoglitore',       en: 'The Gatherer' },
  { num: 88, ar: 'الْغَنِيُّ',  trans: 'Al-Ghani',      it: "L'Autosufficiente",     en: 'The Self-Sufficient' },
  { num: 89, ar: 'الْمُغْنِي',  trans: 'Al-Mughni',     it: 'L\'Arricchitore',       en: 'The Enricher' },
  { num: 90, ar: 'الْمَانِعُ',  trans: "Al-Mani'",      it: 'Il Trattenitore',       en: 'The Preventer' },
  { num: 91, ar: 'الضَّارُّ',   trans: 'Ad-Darr',       it: 'Il Danneggiatore',      en: 'The Distresser' },
  { num: 92, ar: 'النَّافِعُ',  trans: "An-Nafi'",      it: 'Il Benefattore',        en: 'The Benefiter' },
  { num: 93, ar: 'النُّورُ',    trans: 'An-Nur',        it: 'La Luce',               en: 'The Light' },
  { num: 94, ar: 'الْهَادِي',   trans: 'Al-Hadi',       it: 'La Guida',              en: 'The Guide' },
  { num: 95, ar: 'الْبَدِيعُ',  trans: "Al-Badi'",      it: 'Il Creatore Originale', en: 'The Originator' },
  { num: 96, ar: 'الْبَاقِي',   trans: 'Al-Baqi',       it: 'L\'Eterno',             en: 'The Everlasting' },
  { num: 97, ar: 'الْوَارِثُ',  trans: 'Al-Warith',     it: "L'Erede",               en: 'The Inheritor' },
  { num: 98, ar: 'الرَّشِيدُ',  trans: 'Ar-Rashid',     it: 'La Guida Giusta',       en: 'The Guide to the Right Path' },
  { num: 99, ar: 'الصَّبُورُ',  trans: 'As-Sabur',      it: 'Il Paziente',           en: 'The Patient' },
];

const BG_COLORS = ['#e1f5ee','#fef3c7','#ede9fe','#fee2e2','#dbeafe','#f0fdf4','#fdf2f8'];

export default function AsmaulHusnaScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = search.trim()
    ? NAMES.filter((n) =>
        n.trans.toLowerCase().includes(search.toLowerCase()) ||
        n.it.toLowerCase().includes(search.toLowerCase()) ||
        n.ar.includes(search)
      )
    : NAMES;

  const s = styles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Asma ul-Husna</Text>
          <Text style={s.headerSub}>I 99 Nomi di Allah</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.searchWrap}>
        <View style={[s.searchBar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            placeholder="Cerca nome..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        numColumns={3}
        keyExtractor={(item) => item.num.toString()}
        contentContainerStyle={s.grid}
        renderItem={({ item }) => {
          const bg = BG_COLORS[item.num % BG_COLORS.length];
          const isSelected = selected === item.num;
          return (
            <TouchableOpacity
              style={[s.nameCard, { backgroundColor: isSelected ? COLORS.primaryBg : colors.bgSecondary, borderColor: isSelected ? COLORS.primaryBorder : colors.border }]}
              onPress={() => setSelected(isSelected ? null : item.num)}
              activeOpacity={0.8}
            >
              <View style={[s.numBadge, { backgroundColor: bg }]}>
                <Text style={s.numText}>{item.num}</Text>
              </View>
              <Text style={s.nameAr}>{item.ar}</Text>
              <Text style={[s.nameTrans, { color: isSelected ? COLORS.primary : colors.textSecondary }]} numberOfLines={1}>
                {item.trans}
              </Text>
              {isSelected && (
                <Text style={[s.nameIt, { color: colors.text }]} numberOfLines={2}>{item.it}</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '500', textAlign: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'center' },
  searchWrap: { padding: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  grid: { padding: 8, paddingBottom: 40 },
  nameCard: { flex: 1, margin: 4, borderRadius: 12, borderWidth: 0.5, padding: 10, alignItems: 'center', minHeight: 100 },
  numBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  numText: { fontSize: 10, fontWeight: '600', color: '#555' },
  nameAr: { fontSize: 16, color: COLORS.primary, fontWeight: '500', textAlign: 'center', marginBottom: 4 },
  nameTrans: { fontSize: 10, textAlign: 'center' },
  nameIt: { fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 14 },
});
