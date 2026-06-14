// src/screens/AddMosqueScreen.js
// Form pubblico per proporre una nuova moschea
// Va in stato "pending" — un admin la approva prima che appaia nell'app

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar, Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { db } from '../utils/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTheme, COLORS } from '../utils/theme';

export default function AddMosqueScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const [step, setStep] = useState(1); // 1=info, 2=orari, 3=conferma
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Step 1 — Info base
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [imam, setImam] = useState('');
  const [womenSection, setWomenSection] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Step 2 — Orari
  const [prayerTimes, setPrayerTimes] = useState({
    fajr: '', shuruq: '', dhuhr: '', asr: '', maghrib: '', isha: '', jumuah: '',
  });
  const [iqamaTimes, setIqamaTimes] = useState({
    fajr: '', dhuhr: '', asr: '', maghrib: '', isha: '',
  });

  // Step 3 — Contatto
  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState('');

  const s = styles(colors);

  async function detectLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso negato', 'Abilita la posizione per rilevare automaticamente le coordinate.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLat(loc.coords.latitude.toFixed(6));
      setLng(loc.coords.longitude.toFixed(6));

      // Reverse geocode
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (place) {
        if (!city) setCity(place.city || place.district || '');
        if (!country) setCountry(place.country || '');
      }
    } catch (err) {
      Alert.alert('Errore', 'Impossibile rilevare la posizione.');
    } finally {
      setLocating(false);
    }
  }

  function validateStep1() {
    if (!name.trim()) return 'Inserisci il nome della moschea';
    if (!address.trim()) return 'Inserisci l\'indirizzo';
    if (!city.trim()) return 'Inserisci la città';
    if (!lat || !lng) return 'Inserisci o rileva le coordinate';
    return null;
  }

  function validateStep2() {
    const required = ['fajr', 'dhuhr', 'maghrib', 'isha'];
    for (const p of required) {
      if (!prayerTimes[p]) return `Inserisci l'orario per ${p}`;
      if (!/^\d{2}:\d{2}$/.test(prayerTimes[p])) return `Formato non valido per ${p} (usa HH:mm)`;
    }
    return null;
  }

  function nextStep() {
    if (step === 1) {
      const err = validateStep1();
      if (err) { Alert.alert('Attenzione', err); return; }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) { Alert.alert('Attenzione', err); return; }
    }
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    if (!contactEmail.trim() || !contactName.trim()) {
      Alert.alert('Attenzione', 'Inserisci il tuo nome e email di contatto');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(collection(db, 'mosques_pending'));
      await setDoc(ref, {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        phone: phone.trim(),
        imam: imam.trim(),
        womenSection,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        prayerTimes: Object.fromEntries(
          Object.entries(prayerTimes).filter(([, v]) => v.trim())
        ),
        iqamaTimes: Object.fromEntries(
          Object.entries(iqamaTimes).filter(([, v]) => v.trim())
        ),
        contact: {
          name: contactName.trim(),
          email: contactEmail.trim(),
        },
        status: 'pending',
        submittedAt: serverTimestamp(),
      });
      Alert.alert(
        '✓ Proposta inviata!',
        'La moschea verrà verificata e pubblicata entro 24-48 ore. Grazie!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Errore', 'Impossibile inviare la proposta. Riprova.');
    } finally {
      setSaving(false);
    }
  }

  function TimeInput({ label, value, onChange }) {
    return (
      <View style={s.timeWrap}>
        <Text style={s.timeLabel}>{label}</Text>
        <TextInput
          style={[s.timeInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
          value={value}
          onChangeText={onChange}
          placeholder="HH:mm"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Aggiungi Moschea</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Step indicator */}
      <View style={s.stepBar}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={s.stepRow}>
            <View style={[s.stepDot, step >= n && s.stepDotActive]}>
              <Text style={[s.stepNum, step >= n && { color: '#fff' }]}>{n}</Text>
            </View>
            <Text style={[s.stepLabel, { color: step >= n ? COLORS.primary : colors.textTertiary }]}>
              {n === 1 ? 'Info' : n === 2 ? 'Orari' : 'Conferma'}
            </Text>
            {n < 3 && <View style={[s.stepLine, step > n && s.stepLineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* ── STEP 1: Info base ── */}
        {step === 1 && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>INFORMAZIONI MOSCHEA</Text>

            <TextInput style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
              placeholder="Nome della moschea *" placeholderTextColor={colors.textTertiary}
              value={name} onChangeText={setName} />

            <TextInput style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
              placeholder="Indirizzo completo *" placeholderTextColor={colors.textTertiary}
              value={address} onChangeText={setAddress} />

            <View style={s.row}>
              <TextInput style={[s.input, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
                placeholder="Città *" placeholderTextColor={colors.textTertiary}
                value={city} onChangeText={setCity} />
              <View style={{ width: 10 }} />
              <TextInput style={[s.input, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
                placeholder="Paese" placeholderTextColor={colors.textTertiary}
                value={country} onChangeText={setCountry} />
            </View>

            <TextInput style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
              placeholder="Telefono (opzionale)" placeholderTextColor={colors.textTertiary}
              value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <TextInput style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
              placeholder="Nome Imam (opzionale)" placeholderTextColor={colors.textTertiary}
              value={imam} onChangeText={setImam} />

            <View style={[s.switchRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Text style={[s.switchLabel, { color: colors.text }]}>Spazio donne</Text>
              <Switch value={womenSection} onValueChange={setWomenSection}
                trackColor={{ false: colors.border, true: COLORS.primaryLight }}
                thumbColor={womenSection ? COLORS.primary : '#f4f3f4'} />
            </View>

            {/* Coordinate */}
            <Text style={[s.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>COORDINATE GPS</Text>
            <TouchableOpacity style={s.locateBtn} onPress={detectLocation} disabled={locating}>
              {locating
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="locate" size={16} color="#fff" /><Text style={s.locateBtnText}>Rileva posizione automaticamente</Text></>
              }
            </TouchableOpacity>

            <View style={s.row}>
              <TextInput style={[s.input, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
                placeholder="Latitudine *" placeholderTextColor={colors.textTertiary}
                value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
              <View style={{ width: 10 }} />
              <TextInput style={[s.input, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
                placeholder="Longitudine *" placeholderTextColor={colors.textTertiary}
                value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
            </View>
            <Text style={[s.hint, { color: colors.textTertiary }]}>
              Oppure trova le coordinate su maps.google.com → clicca tasto destro sul luogo → copia coordinate
            </Text>
          </View>
        )}

        {/* ── STEP 2: Orari ── */}
        {step === 2 && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>ORARI DI PREGHIERA</Text>
            <View style={[s.note, { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder }]}>
              <Ionicons name="information-circle" size={14} color={COLORS.primary} />
              <Text style={[s.noteText, { color: COLORS.primary }]}>
                Inserisci gli orari reali della tua moschea. Fajr, Dhuhr, Maghrib e Isha sono obbligatori.
              </Text>
            </View>
            <View style={s.timesGrid}>
              {Object.keys(prayerTimes).map((name) => (
                <TimeInput key={name} label={name.charAt(0).toUpperCase() + name.slice(1)}
                  value={prayerTimes[name]}
                  onChange={(v) => setPrayerTimes((p) => ({ ...p, [name]: v }))} />
              ))}
            </View>

            <Text style={[s.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>ORARI IQAMA (opzionale)</Text>
            <View style={s.timesGrid}>
              {Object.keys(iqamaTimes).map((name) => (
                <TimeInput key={name} label={name.charAt(0).toUpperCase() + name.slice(1)}
                  value={iqamaTimes[name]}
                  onChange={(v) => setIqamaTimes((p) => ({ ...p, [name]: v }))} />
              ))}
            </View>
          </View>
        )}

        {/* ── STEP 3: Conferma ── */}
        {step === 3 && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>I TUOI DATI DI CONTATTO</Text>
            <View style={[s.note, { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder }]}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
              <Text style={[s.noteText, { color: COLORS.primary }]}>
                Serviranno solo per verificare la moschea. Non saranno pubblici.
              </Text>
            </View>

            <TextInput style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
              placeholder="Il tuo nome *" placeholderTextColor={colors.textTertiary}
              value={contactName} onChangeText={setContactName} />
            <TextInput style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgSecondary }]}
              placeholder="La tua email *" placeholderTextColor={colors.textTertiary}
              value={contactEmail} onChangeText={setContactEmail}
              keyboardType="email-address" autoCapitalize="none" />

            {/* Riepilogo */}
            <Text style={[s.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>RIEPILOGO</Text>
            <View style={[s.summary, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Text style={[s.summaryName, { color: colors.text }]}>{name}</Text>
              <Text style={[s.summaryLine, { color: colors.textSecondary }]}>{address}, {city}</Text>
              <Text style={[s.summaryLine, { color: colors.textSecondary }]}>
                Fajr {prayerTimes.fajr} · Dhuhr {prayerTimes.dhuhr} · Maghrib {prayerTimes.maghrib} · Isha {prayerTimes.isha}
              </Text>
              {prayerTimes.jumuah ? <Text style={[s.summaryLine, { color: colors.textSecondary }]}>Jumu'ah {prayerTimes.jumuah}</Text> : null}
            </View>
          </View>
        )}

        {/* Pulsante avanti / invia */}
        {step < 3 ? (
          <TouchableOpacity style={s.nextBtn} onPress={nextStep}>
            <Text style={s.nextBtnText}>Continua</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.nextBtn} onPress={handleSubmit} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="send" size={16} color="#fff" /><Text style={s.nextBtnText}>Invia proposta</Text></>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '500' },

  stepBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 0 },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.bgSecondary, borderWidth: 1.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { fontSize: 12, fontWeight: '600', color: c.textTertiary },
  stepLabel: { fontSize: 11, marginLeft: 4, marginRight: 4 },
  stepLine: { width: 30, height: 1.5, backgroundColor: c.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: COLORS.primary },

  sectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  input: { borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, marginBottom: 10 },
  row: { flexDirection: 'row' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  switchLabel: { fontSize: 14 },

  locateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 10, justifyContent: 'center' },
  locateBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  hint: { fontSize: 11, lineHeight: 16, marginBottom: 10 },

  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeWrap: { width: '47%' },
  timeLabel: { color: c.textSecondary, fontSize: 11, marginBottom: 4 },
  timeInput: { borderWidth: 0.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 15, fontWeight: '500' },

  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderWidth: 0.5, borderRadius: 10, padding: 10, marginBottom: 14 },
  noteText: { fontSize: 12, flex: 1, lineHeight: 17 },

  summary: { borderRadius: 12, borderWidth: 0.5, padding: 14, marginBottom: 10 },
  summaryName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  summaryLine: { fontSize: 13, lineHeight: 20 },

  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, marginTop: 20 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
