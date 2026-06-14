// src/screens/MosqueDetailScreen.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp, PRAYER_NAMES } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';

export default function MosqueDetailScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { mosque } = route.params;
  const { selectedMosque, selectMosque } = useApp();
  const isSelected = selectedMosque?.id === mosque.id;
  const s = styles(colors);

  function InfoRow({ icon, label, value, onPress }) {
    if (!value) return null;
    return (
      <TouchableOpacity style={s.infoRow} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
        <Ionicons name={icon} size={15} color={COLORS.primary} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.infoLabel}>{label}</Text>
          <Text style={[s.infoValue, onPress && { color: COLORS.primaryLight }]}>{value}</Text>
        </View>
        {onPress && <Ionicons name="open-outline" size={13} color={colors.textTertiary} />}
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: COLORS.primary }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerName}>{mosque.name}</Text>
          <Text style={s.headerCity}>{mosque.city || mosque.address}</Text>
          <TouchableOpacity
            style={[s.favBtn, isSelected && s.favBtnActive]}
            onPress={() => selectMosque(isSelected ? null : mosque)}
          >
            <Ionicons name={isSelected ? 'star' : 'star-outline'} size={16} color={isSelected ? COLORS.primary : '#fff'} />
            <Text style={[s.favBtnText, isSelected && { color: COLORS.primary }]}>
              {isSelected ? t('favorite') : t('setAsFavorite')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('about')}</Text>
          <View style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <InfoRow icon="location-outline" label={t('address')} value={mosque.address} />
            <InfoRow icon="call-outline" label={t('phone')} value={mosque.phone}
              onPress={() => mosque.phone && Linking.openURL(`tel:${mosque.phone}`)} />
            <InfoRow icon="globe-outline" label={t('website')} value={mosque.website}
              onPress={() => mosque.website && Linking.openURL(mosque.website)} />
            <InfoRow icon="person-outline" label={t('imam')} value={mosque.imam} />
            <InfoRow icon="people-outline" label={t('capacity')} value={mosque.capacity?.toString()} />
            <View style={s.infoRow}>
              <Ionicons name="female-outline" size={15} color={COLORS.primary} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>{t('womenFacilities')}</Text>
                <Text style={s.infoValue}>{mosque.womenSection ? t('yes') : t('no')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Prayer times */}
        {mosque.prayerTimes && (
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionTitle}>{t('prayerTimes')}</Text>
              <View style={s.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={11} color={COLORS.primary} />
                <Text style={s.verifiedText}>{t('updatedBy')}</Text>
              </View>
            </View>
            <View style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              {PRAYER_NAMES.map((name, i) => {
                const time = mosque.prayerTimes[name];
                const iqama = mosque.iqamaTimes?.[name];
                if (!time) return null;
                return (
                  <View key={name} style={[s.timeRow, i < PRAYER_NAMES.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                    <Text style={[s.timeName, { color: colors.textSecondary }]}>{t(name)}</Text>
                    <View style={s.timeRight}>
                      <Text style={[s.timeVal, { color: colors.text }]}>{time}</Text>
                      {iqama && <Text style={[s.iqamaVal, { color: colors.textTertiary }]}>{t('iqama')} {iqama}</Text>}
                    </View>
                  </View>
                );
              })}
              {mosque.prayerTimes.jumuah && (
                <View style={[s.timeRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                  <Text style={[s.timeName, { color: colors.textSecondary }]}>{t('jumuah')}</Text>
                  <Text style={[s.timeVal, { color: colors.text }]}>{mosque.prayerTimes.jumuah}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { marginBottom: 12 },
  headerName: { color: '#fff', fontSize: 22, fontWeight: '500' },
  headerCity: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 3, marginBottom: 14 },
  favBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' },
  favBtnActive: { backgroundColor: '#fff' },
  favBtnText: { color: '#fff', fontSize: 13 },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: c.textSecondary, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 0.5, borderColor: COLORS.primaryBorder },
  verifiedText: { color: COLORS.primary, fontSize: 10 },

  card: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: c.border },
  infoLabel: { color: c.textTertiary, fontSize: 11, marginBottom: 2 },
  infoValue: { color: c.text, fontSize: 14 },

  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  timeName: { fontSize: 14 },
  timeRight: { alignItems: 'flex-end' },
  timeVal: { fontSize: 14, fontWeight: '500' },
  iqamaVal: { fontSize: 11, marginTop: 2 },
});
