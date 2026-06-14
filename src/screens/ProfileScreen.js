// src/screens/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useFeatures, FEATURE_META } from '../context/FeaturesContext';
import { useTheme, COLORS } from '../utils/theme';
import { CALCULATION_METHODS } from '../utils/prayerTimes';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { language, setLanguage, calculationMethod, theme, timeFormat, updateSetting } = useApp();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const { features, toggleFeature, resetFeatures } = useFeatures();
  const s = styles(colors);

  function Row({ icon, label, children, onPress, last = false }) {
    return (
      <TouchableOpacity style={[s.row, last && s.rowLast]} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
        <View style={s.rowLeft}>
          <View style={s.iconWrap}>
            <Ionicons name={icon} size={16} color={COLORS.primary} />
          </View>
          <Text style={[s.rowLabel, { color: colors.text }]}>{label}</Text>
        </View>
        <View style={s.rowRight}>{children}</View>
      </TouchableOpacity>
    );
  }

  function Section({ title, children }) {
    return (
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
        <View style={[s.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <View style={s.avatar}>
          <Ionicons name="person" size={28} color={COLORS.primary} />
        </View>
        <Text style={s.appName}>MasjidConnect</Text>
        <Text style={s.version}>{t('version', { v: '1.0.0' })}</Text>
      </View>

      {/* Language */}
      <Section title={t('language')}>
        <View style={s.langGrid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[s.langBtn, language === lang.code && s.langBtnActive]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text style={s.langFlag}>{lang.flag}</Text>
              <Text style={[s.langLabel, language === lang.code && { color: COLORS.primary, fontWeight: '500' }]}>
                {lang.label}
              </Text>
              {language === lang.code && (
                <Ionicons name="checkmark" size={12} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* Notifications */}
      <Section title={t('notifications')}>
        <Row icon="notifications-outline" label="Notifiche Adhan" onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </Row>
        <Row icon="musical-notes-outline" label={t('chooseAdhan')} onPress={() => navigation.navigate('Qibla')} last>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </Row>
      </Section>

      {/* Calculation method */}
      <Section title={t('calculationMethod')}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Object.entries(CALCULATION_METHODS).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[s.methodChip, calculationMethod === key && s.methodChipActive]}
                onPress={() => updateSetting('calculationMethod', key)}
              >
                <Text style={[s.methodText, calculationMethod === key && { color: COLORS.primary }]} numberOfLines={1}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Section>

      {/* Theme */}
      <Section title={t('theme')}>
        <View style={s.themeRow}>
          {['light', 'dark', 'system'].map((t_) => (
            <TouchableOpacity
              key={t_}
              style={[s.themeBtn, theme === t_ && s.themeBtnActive]}
              onPress={() => updateSetting('theme', t_)}
            >
              <Ionicons
                name={t_ === 'light' ? 'sunny-outline' : t_ === 'dark' ? 'moon-outline' : 'phone-portrait-outline'}
                size={16}
                color={theme === t_ ? COLORS.primary : colors.textSecondary}
              />
              <Text style={[s.themeLabel, theme === t_ && { color: COLORS.primary }]}>
                {t(t_)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* Formato orario */}
      <Section title="Formato orario">
        <View style={s.themeRow}>
          {['24h', '12h'].map((fmt) => (
            <TouchableOpacity
              key={fmt}
              style={[s.themeBtn, timeFormat === fmt && s.themeBtnActive]}
              onPress={() => updateSetting('timeFormat', fmt)}
            >
              <Ionicons
                name={fmt === '24h' ? 'time-outline' : 'time'}
                size={16}
                color={timeFormat === fmt ? COLORS.primary : colors.textSecondary}
              />
              <Text style={[s.themeLabel, timeFormat === fmt && { color: COLORS.primary }]}>
                {fmt === '24h' ? '24 ore (15:30)' : '12 ore (3:30 PM)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* Funzionalità */}
      <Section title="Funzionalità attive">
        {Object.entries(FEATURE_META).map(([key, meta]) => (
          <Row key={key} icon={meta.icon} label={meta.label}>
            <Switch
              value={features[key] !== false}
              onValueChange={() => toggleFeature(key)}
              trackColor={{ false: colors.border, true: COLORS.primaryLight }}
              thumbColor={features[key] !== false ? COLORS.primary : '#f4f3f4'}
            />
          </Row>
        ))}
        <TouchableOpacity style={{ padding: 14, alignItems: 'center' }} onPress={resetFeatures}>
          <Text style={{ color: COLORS.primary, fontSize: 13 }}>Ripristina tutte le funzionalità</Text>
        </TouchableOpacity>
      </Section>

      {/* Admin */}
      <Section title={t('adminAccess')}>
        <Row icon="shield-outline" label={t('adminAccessDesc')} onPress={() => navigation.navigate('AdminLogin')} last>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </Row>
      </Section>

      {/* About */}
      <Section title={t('about')}>
        <Row icon="star-outline" label={t('rateApp')} onPress={() => {}} />
        <Row icon="bug-outline" label={t('reportIssue')} onPress={() => {}} />
        <Row icon="document-text-outline" label={t('privacy')} onPress={() => {}} last />
      </Section>
    </ScrollView>
  );
}

const styles = (c) => StyleSheet.create({
  header: { paddingTop: 64, paddingBottom: 28, alignItems: 'center', gap: 6 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  appName: { color: '#fff', fontSize: 20, fontWeight: '500' },
  version: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sectionCard: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.border },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14 },

  langGrid: { padding: 8, gap: 6 },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: c.border },
  langBtnActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder },
  langFlag: { fontSize: 16 },
  langLabel: { fontSize: 13, flex: 1, color: c.text },

  methodChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: c.bgSecondary, borderWidth: 0.5, borderColor: c.border, maxWidth: 200 },
  methodChipActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder },
  methodText: { fontSize: 12, color: c.textSecondary },

  themeRow: { flexDirection: 'row', padding: 8, gap: 8 },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: c.bgSecondary, borderWidth: 0.5, borderColor: c.border },
  themeBtnActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder },
  themeLabel: { fontSize: 12, color: c.textSecondary },
});
