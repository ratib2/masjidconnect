// src/screens/AdminAnnouncementsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Switch, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { db } from '../utils/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';

export default function AdminAnnouncementsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { selectedMosque, loadMosques } = useApp();

  const [announcements, setAnnouncements] = useState(selectedMosque?.announcements || []);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const s = styles(colors);

  async function handleAdd() {
    if (!newTitle.trim() || !newBody.trim()) {
      Alert.alert('Error', 'Please fill in both title and message');
      return;
    }
    if (!selectedMosque) {
      Alert.alert('Error', 'No mosque selected');
      return;
    }
    setSaving(true);
    const newAnn = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      body: newBody.trim(),
      important: isImportant,
      date: new Date().toISOString(),
    };
    try {
      await updateDoc(doc(db, 'mosques', selectedMosque.id), {
        announcements: arrayUnion(newAnn),
        updatedAt: serverTimestamp(),
      });
      setAnnouncements((prev) => [newAnn, ...prev]);
      setNewTitle('');
      setNewBody('');
      setIsImportant(false);
      setShowForm(false);
      await loadMosques();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ann) {
    Alert.alert('Delete', `Delete "${ann.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await updateDoc(doc(db, 'mosques', selectedMosque.id), {
              announcements: arrayRemove(ann),
            });
            setAnnouncements((prev) => prev.filter((a) => a.id !== ann.id));
            await loadMosques();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Manage Announcements</Text>
        <TouchableOpacity onPress={() => setShowForm((v) => !v)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Add form */}
        {showForm && (
          <View style={[s.form, { backgroundColor: colors.bgSecondary, borderColor: COLORS.primaryBorder }]}>
            <Text style={[s.formTitle, { color: colors.text }]}>New Announcement</Text>
            <TextInput
              style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
              placeholder="Title"
              placeholderTextColor={colors.textTertiary}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[s.input, s.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
              placeholder="Message..."
              placeholderTextColor={colors.textTertiary}
              value={newBody}
              onChangeText={setNewBody}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={s.importantRow}>
              <Text style={[s.importantLabel, { color: colors.text }]}>Mark as important</Text>
              <Switch
                value={isImportant}
                onValueChange={setIsImportant}
                trackColor={{ false: colors.border, true: COLORS.primaryLight }}
                thumbColor={isImportant ? COLORS.primary : '#f4f3f4'}
              />
            </View>
            <TouchableOpacity style={s.addBtn} onPress={handleAdd} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.addBtnText}>Publish Announcement</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Existing announcements */}
        <View style={{ padding: 16 }}>
          <Text style={[s.listTitle, { color: colors.textSecondary }]}>
            Published ({announcements.length})
          </Text>
          {announcements.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="megaphone-outline" size={36} color={colors.textTertiary} />
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>No announcements yet</Text>
            </View>
          )}
          {announcements.map((ann) => (
            <View key={ann.id} style={[s.annCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }, ann.important && { borderLeftWidth: 3, borderLeftColor: COLORS.primary }]}>
              <View style={s.annTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.annTitle, { color: colors.text }]}>{ann.title}</Text>
                  <Text style={[s.annDate, { color: colors.textTertiary }]}>
                    {new Date(ann.date).toLocaleDateString()}
                  </Text>
                </View>
                {ann.important && (
                  <View style={s.impBadge}>
                    <Text style={s.impText}>Important</Text>
                  </View>
                )}
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(ann)}>
                  <Ionicons name="trash-outline" size={16} color="#e24b4a" />
                </TouchableOpacity>
              </View>
              <Text style={[s.annBody, { color: colors.textSecondary }]} numberOfLines={2}>{ann.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '500' },

  form: { margin: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
  formTitle: { fontSize: 16, fontWeight: '500', marginBottom: 12 },
  input: { borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  textarea: { height: 90, paddingTop: 10 },
  importantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  importantLabel: { fontSize: 14 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  listTitle: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13 },

  annCard: { borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 0.5 },
  annTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  annTitle: { fontSize: 14, fontWeight: '500' },
  annDate: { fontSize: 11, marginTop: 2 },
  annBody: { fontSize: 12, lineHeight: 18 },
  impBadge: { backgroundColor: COLORS.primaryBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  impText: { color: COLORS.primary, fontSize: 10, fontWeight: '500' },
  deleteBtn: { padding: 4 },
});
