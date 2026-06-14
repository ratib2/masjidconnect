// src/screens/ToolsHubScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, COLORS } from '../utils/theme';
import { useFeatures } from '../context/FeaturesContext';

const ALL_TOOLS = [
  { id: 'CalendarMain', featureKey: 'calendar', icon: 'calendar-outline', label: 'Calendario Islamico', description: 'Calendario Hijri, eventi islamici e annunci moschea', color: COLORS.primary, bg: '#e1f5ee' },
  { id: 'Qibla',        featureKey: 'qibla',    icon: 'compass-outline',  label: 'Bussola Qibla',      description: 'Direzione esatta della Kaaba da qualsiasi luogo', color: '#1d9e75', bg: '#d1fae5' },
  { id: 'Dhikr',        featureKey: 'dhikr',    icon: 'hand-left-outline', label: 'Contatore Dhikr',   description: 'Conta il tuo dhikr con statistiche giornaliere', color: '#6366f1', bg: '#ede9fe' },
  { id: 'Quran',        featureKey: 'quran',    icon: 'book-outline',     label: 'Al-Quran',           description: '114 sure con testo arabo e traduzione italiana', color: '#059669', bg: '#ecfdf5' },
  { id: 'Dua',          featureKey: 'dua',      icon: 'hand-right-outline',label: 'Dua & Adhkar',      description: '14+ dua per ogni occasione in arabo e italiano', color: '#f59e0b', bg: '#fef3c7' },
  { id: 'AsmaulHusna',  featureKey: 'asmaulHusna', icon: 'star-outline',  label: 'Asma ul-Husna',     description: 'I 99 nomi di Allah con significati', color: '#ec4899', bg: '#fdf2f8' },
  { id: 'Ramadan',      featureKey: 'ramadan',  icon: 'moon-outline',     label: 'Ramadan',            description: 'Countdown, Suhoor/Iftar e dua di Ramadan', color: '#8b5cf6', bg: '#f5f3ff' },
];

export default function ToolsHubScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { features } = useFeatures();
  const s = styles(colors);

  const visibleTools = ALL_TOOLS.filter((t) => features[t.featureKey] !== false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <Text style={s.headerTitle}>Strumenti</Text>
        <Text style={s.headerSub}>Strumenti islamici completi</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
        {visibleTools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[s.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
            onPress={() => navigation.navigate(tool.id)}
            activeOpacity={0.8}
          >
            <View style={[s.iconWrap, { backgroundColor: tool.bg }]}>
              <Ionicons name={tool.icon} size={26} color={tool.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardLabel, { color: colors.text }]}>{tool.label}</Text>
              <Text style={[s.cardDesc, { color: colors.textSecondary }]}>{tool.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
        {visibleTools.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="apps-outline" size={40} color={colors.textTertiary} />
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>
              Tutti gli strumenti sono disattivati.{'\n'}Vai in Profilo → Funzionalità per riattivarli.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '500' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 16, borderWidth: 0.5 },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 15, fontWeight: '500', marginBottom: 3 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
