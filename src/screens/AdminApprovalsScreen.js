// src/screens/AdminApprovalsScreen.js
// Pannello admin per approvare/rifiutare le moschee proposte dal pubblico

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { db } from '../utils/firebase';
import {
  collection, getDocs, doc, setDoc, deleteDoc,
  updateDoc, serverTimestamp, query, where,
} from 'firebase/firestore';
import { useTheme, COLORS } from '../utils/theme';

export default function AdminApprovalsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => { loadPending(); }, []);

  async function loadPending() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'mosques_pending'));
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.status === 'pending');
      setPending(all);
    } catch (err) {
      Alert.alert('Errore', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function approve(mosque) {
    setProcessing(mosque.id);
    try {
      // Copy to mosques collection
      const { id, status, submittedAt, contact, ...data } = mosque;
      const ref = doc(collection(db, 'mosques'));
      await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      // Mark as approved
      await updateDoc(doc(db, 'mosques_pending', mosque.id), { status: 'approved' });
      setPending((prev) => prev.filter((m) => m.id !== mosque.id));
      Alert.alert('✓ Approvata', `"${mosque.name}" è ora visibile nell'app.`);
    } catch (err) {
      Alert.alert('Errore', err.message);
    } finally {
      setProcessing(null);
    }
  }

  async function reject(mosque) {
    Alert.alert('Rifiuta', `Rifiutare "${mosque.name}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Rifiuta', style: 'destructive', onPress: async () => {
          setProcessing(mosque.id);
          try {
            await updateDoc(doc(db, 'mosques_pending', mosque.id), { status: 'rejected' });
            setPending((prev) => prev.filter((m) => m.id !== mosque.id));
          } catch (err) {
            Alert.alert('Errore', err.message);
          } finally {
            setProcessing(null);
          }
        }
      }
    ]);
  }

  const s = styles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Approvazioni</Text>
        <TouchableOpacity onPress={loadPending}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : pending.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>Nessuna proposta in attesa</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={[s.countLabel, { color: colors.textSecondary }]}>
            {pending.length} proposta{pending.length > 1 ? 'e' : ''} in attesa di approvazione
          </Text>
          {pending.map((mosque) => (
            <View key={mosque.id} style={[s.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Text style={[s.mosqueName, { color: colors.text }]}>{mosque.name}</Text>
              <Text style={[s.mosqueAddr, { color: colors.textSecondary }]}>{mosque.address}, {mosque.city}</Text>

              {mosque.contact && (
                <View style={s.contactRow}>
                  <Ionicons name="person-outline" size={13} color={colors.textTertiary} />
                  <Text style={[s.contactText, { color: colors.textTertiary }]}>
                    {mosque.contact.name} · {mosque.contact.email}
                  </Text>
                </View>
              )}

              {/* Prayer times preview */}
              {mosque.prayerTimes && (
                <View style={[s.timesPreview, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  {['fajr', 'dhuhr', 'maghrib', 'isha'].map((p) => (
                    mosque.prayerTimes[p] ? (
                      <View key={p} style={s.timeItem}>
                        <Text style={[s.timeName, { color: colors.textTertiary }]}>{p}</Text>
                        <Text style={[s.timeVal, { color: colors.text }]}>{mosque.prayerTimes[p]}</Text>
                      </View>
                    ) : null
                  ))}
                </View>
              )}

              <View style={s.actions}>
                <TouchableOpacity
                  style={s.rejectBtn}
                  onPress={() => reject(mosque)}
                  disabled={processing === mosque.id}
                >
                  <Ionicons name="close" size={16} color="#e24b4a" />
                  <Text style={s.rejectText}>Rifiuta</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.approveBtn}
                  onPress={() => approve(mosque)}
                  disabled={processing === mosque.id}
                >
                  {processing === mosque.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={s.approveText}>Approva</Text></>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14 },
  countLabel: { fontSize: 12, marginBottom: 12 },
  card: { borderRadius: 14, borderWidth: 0.5, padding: 14, marginBottom: 12 },
  mosqueName: { fontSize: 16, fontWeight: '500', marginBottom: 3 },
  mosqueAddr: { fontSize: 13, marginBottom: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  contactText: { fontSize: 12 },
  timesPreview: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 8, borderWidth: 0.5, padding: 10, marginBottom: 12 },
  timeItem: { alignItems: 'center' },
  timeName: { fontSize: 10, textTransform: 'uppercase' },
  timeVal: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#e24b4a', borderRadius: 10, paddingVertical: 10 },
  rejectText: { color: '#e24b4a', fontSize: 14, fontWeight: '500' },
  approveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10 },
  approveText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
