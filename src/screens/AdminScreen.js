// src/screens/AdminScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { adminLogin, adminLogout, updateMosqueTimes } from '../utils/firebase';
import { auth } from '../utils/firebase';
import { useApp } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';

const PRAYER_FIELDS = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah'];
const IQAMA_FIELDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function AdminScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { selectedMosque, loadMosques } = useApp();

  const [user, setUser] = useState(auth.currentUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [prayerTimes, setPrayerTimes] = useState({
    fajr: '', shuruq: '', dhuhr: '', asr: '', maghrib: '', isha: '', jumuah: '',
  });
  const [iqamaTimes, setIqamaTimes] = useState({
    fajr: '', dhuhr: '', asr: '', maghrib: '', isha: '',
  });
  const [saving, setSaving] = useState(false);

  const s = styles(colors);

  async function handleLogin() {
    if (!email || !password) return;
    setLoginLoading(true);
    try {
      const cred = await adminLogin(email, password);
      setUser(cred.user);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await adminLogout();
    setUser(null);
  }

  async function handleSave() {
    if (!selectedMosque) {
      Alert.alert(t('error'), 'Select your mosque first from the Mosques tab');
      return;
    }
    // Validate time format HH:mm
    const allTimes = { ...prayerTimes, ...iqamaTimes };
    for (const [key, val] of Object.entries(allTimes)) {
      if (val && !/^\d{2}:\d{2}$/.test(val)) {
        Alert.alert(t('error'), `Invalid format for ${key}. Use HH:mm`);
        return;
      }
    }
    setSaving(true);
    try {
      await updateMosqueTimes(selectedMosque.id, prayerTimes, iqamaTimes);
      await loadMosques();
      Alert.alert('✓', t('saved'));
    } catch (err) {
      Alert.alert(t('error'), t('errorSaving'));
    } finally {
      setSaving(false);
    }
  }

  function TimeInput({ label, value, onChange, placeholder = 'HH:mm' }) {
    return (
      <View style={s.timeInputWrap}>
        <Text style={s.timeLabel}>{label}</Text>
        <TextInput
          style={[s.timeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
      </View>
    );
  }

  // Login form
  if (!user) {
    return (
      <View style={[s.loginContainer, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.loginHeader}>
          <View style={s.loginIcon}>
            <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
          </View>
          <Text style={[s.loginTitle, { color: colors.text }]}>{t('adminPanel')}</Text>
          <Text style={[s.loginSub, { color: colors.textSecondary }]}>{t('adminAccessDesc')}</Text>
        </View>
        <View style={s.loginForm}>
          <TextInput
            style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loginLoading}>
            {loginLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginBtnText}>{t('loginAsAdmin')}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Admin panel
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[s.panelHeader, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.panelBack}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.panelTitle}>{t('adminPanel')}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Mosque indicator */}
      <View style={[s.mosqueBanner, { backgroundColor: selectedMosque ? COLORS.primaryBg : colors.bgSecondary, borderColor: selectedMosque ? COLORS.primaryBorder : colors.border }]}>
        <Ionicons name={selectedMosque ? 'checkmark-circle' : 'alert-circle-outline'} size={16} color={selectedMosque ? COLORS.primary : colors.textTertiary} />
        <Text style={[s.mosqueBannerText, { color: selectedMosque ? COLORS.primary : colors.textSecondary }]}>
          {selectedMosque ? selectedMosque.name : 'Select your mosque from the Mosques tab'}
        </Text>
      </View>

      <View style={s.formSection}>
        <Text style={[s.formTitle, { color: colors.text }]}>{t('updateTimes')}</Text>

        {/* Prayer times */}
        <Text style={[s.subTitle, { color: colors.textSecondary }]}>{t('prayerTimes')}</Text>
        <View style={s.grid}>
          {PRAYER_FIELDS.map((name) => (
            <TimeInput
              key={name}
              label={t(name)}
              value={prayerTimes[name]}
              onChange={(v) => setPrayerTimes((prev) => ({ ...prev, [name]: v }))}
            />
          ))}
        </View>

        {/* Iqama times */}
        <Text style={[s.subTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('iqama')}</Text>
        <View style={s.grid}>
          {IQAMA_FIELDS.map((name) => (
            <TimeInput
              key={name}
              label={t(name)}
              value={iqamaTimes[name]}
              onChange={(v) => setIqamaTimes((prev) => ({ ...prev, [name]: v }))}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={s.btnRow}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={[s.cancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.saveBtnText}>{t('save')}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (c) => StyleSheet.create({
  loginContainer: { flex: 1, paddingHorizontal: 28 },
  backBtn: { marginTop: 56, marginBottom: 8 },
  loginHeader: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  loginIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  loginTitle: { fontSize: 22, fontWeight: '500', marginBottom: 6 },
  loginSub: { fontSize: 13, textAlign: 'center' },
  loginForm: { gap: 12 },
  input: { borderWidth: 0.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },

  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  panelBack: { padding: 4 },
  panelTitle: { color: '#fff', fontSize: 18, fontWeight: '500' },

  mosqueBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 20, marginBottom: 0, borderRadius: 12, padding: 12, borderWidth: 0.5 },
  mosqueBannerText: { fontSize: 13, flex: 1 },

  formSection: { padding: 20 },
  formTitle: { fontSize: 18, fontWeight: '500', marginBottom: 16 },
  subTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '500', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  timeInputWrap: { width: '47%' },
  timeLabel: { color: c.textSecondary, fontSize: 11, marginBottom: 4 },
  timeInput: { borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontWeight: '500' },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 0.5, borderColor: c.border, alignItems: 'center' },
  cancelText: { fontSize: 15 },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
