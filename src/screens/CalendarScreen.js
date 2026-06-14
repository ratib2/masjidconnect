// src/screens/CalendarScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';

// Hijri conversion (simplified — for production use a dedicated library)
function gregorianToHijri(date) {
  // Using the Umm al-Qura algorithm approximation
  const JD = Math.floor((14 + 12 * (date.getFullYear() + 4800) - Math.floor((date.getMonth() + 1 - 14) / 12)) / 12)
    + date.getDate() + Math.floor((153 * ((date.getMonth() + 1) + (date.getMonth() + 1 <= 2 ? 9 : -3)) + 2) / 5)
    + 365 * (date.getFullYear() + 4800 - Math.floor((date.getMonth() + 1 - 14) / 12))
    + Math.floor((date.getFullYear() + 4800 - Math.floor((date.getMonth() + 1 - 14) / 12)) / 4)
    - Math.floor((date.getFullYear() + 4800 - Math.floor((date.getMonth() + 1 - 14) / 12)) / 100)
    + Math.floor((date.getFullYear() + 4800 - Math.floor((date.getMonth() + 1 - 14) / 12)) / 400)
    - 32075;

  let l = JD - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719)
    + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hMonth = Math.floor((24 * l) / 709);
  const hDay = l - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;
  return { day: hDay, month: hMonth, year: hYear };
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

const ISLAMIC_EVENTS = {
  '1-1': 'Islamic New Year',
  '1-10': 'Day of Ashura',
  '3-12': "Mawlid al-Nabi (Prophet's Birthday)",
  '7-27': "Isra' and Mi'raj",
  '8-15': "Laylat al-Bara'ah",
  '9-1': 'First day of Ramadan',
  '9-27': 'Laylat al-Qadr (probable)',
  '10-1': 'Eid al-Fitr',
  '12-9': 'Day of Arafah',
  '12-10': 'Eid al-Adha',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { selectedMosque } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);

  const hijri = gregorianToHijri(selectedDay);
  const todayHijri = gregorianToHijri(new Date());
  const eventKey = `${hijri.month}-${hijri.day}`;
  const todayEvent = ISLAMIC_EVENTS[`${todayHijri.month}-${todayHijri.day}`];

  // Load mosque announcements from context / firebase
  useEffect(() => {
    if (selectedMosque?.announcements) {
      setAnnouncements(selectedMosque.announcements);
    } else {
      // Demo announcements
      setAnnouncements([
        {
          id: '1',
          title: 'Ramadan Schedule Update',
          body: 'During Ramadan, Tarawih prayers will begin at 22:30 after Isha. All are welcome.',
          date: new Date().toISOString(),
          important: true,
        },
        {
          id: '2',
          title: "Jumu'ah Reminder",
          body: "First Jumu'ah khutbah at 13:15, second at 14:15. Please arrive early.",
          date: new Date(Date.now() - 86400000).toISOString(),
          important: false,
        },
        {
          id: '3',
          title: 'Islamic Studies Classes',
          body: 'Weekly Quran and Tajweed classes every Saturday at 10:00. Free for all ages.',
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          important: false,
        },
      ]);
    }
  }, [selectedMosque]);

  // Calendar grid for current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  const selectedHijri = gregorianToHijri(selectedDay);
  const selectedEventKey = `${selectedHijri.month}-${selectedHijri.day}`;
  const selectedEvent = ISLAMIC_EVENTS[selectedEventKey];

  const s = styles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: COLORS.primary }]}>
        <Text style={s.headerTitle}>Calendar</Text>
        <View style={s.hijriToday}>
          <Text style={s.hijriTodayText}>
            {todayHijri.day} {HIJRI_MONTHS[todayHijri.month - 1]} {todayHijri.year} H
          </Text>
          {todayEvent && <Text style={s.hijriEvent}>✦ {todayEvent}</Text>}
        </View>
      </View>

      <ScrollView>
        {/* Month navigator */}
        <View style={s.monthNav}>
          <TouchableOpacity style={s.navBtn} onPress={prevMonth}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[s.monthLabel, { color: colors.text }]}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity style={s.navBtn} onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={s.dayHeaders}>
          {DAYS.map((d) => (
            <Text key={d} style={[s.dayHeader, { color: d === 'Fri' ? COLORS.primary : colors.textSecondary }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={s.grid}>
          {calendarDays.map((day, i) => {
            if (!day) return <View key={`e-${i}`} style={s.dayCell} />;
            const date = new Date(year, month, day);
            const h = gregorianToHijri(date);
            const hKey = `${h.month}-${h.day}`;
            const hasEvent = !!ISLAMIC_EVENTS[hKey];
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay.getDate() && month === selectedDay.getMonth() && year === selectedDay.getFullYear();
            const isFriday = date.getDay() === 5;
            return (
              <TouchableOpacity
                key={day}
                style={[s.dayCell, isSelected && s.dayCellSelected, isToday && !isSelected && s.dayCellToday]}
                onPress={() => setSelectedDay(date)}
              >
                <Text style={[
                  s.dayNum,
                  { color: isSelected ? '#fff' : isFriday ? COLORS.primary : colors.text },
                  isToday && !isSelected && { color: COLORS.primary, fontWeight: '500' },
                ]}>
                  {day}
                </Text>
                <Text style={[s.dayHijri, { color: isSelected ? 'rgba(255,255,255,0.75)' : colors.textTertiary }]}>
                  {h.day}
                </Text>
                {hasEvent && <View style={[s.eventDot, isSelected && { backgroundColor: '#fff' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected day info */}
        <View style={[s.selectedInfo, { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder }]}>
          <Text style={s.selectedGreg}>
            {selectedDay.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Text style={s.selectedHijri}>
            {selectedHijri.day} {HIJRI_MONTHS[selectedHijri.month - 1]} {selectedHijri.year} H
          </Text>
          {selectedEvent && (
            <View style={s.eventBadge}>
              <Ionicons name="star" size={11} color={COLORS.primary} />
              <Text style={s.eventBadgeText}>{selectedEvent}</Text>
            </View>
          )}
        </View>

        {/* Mosque announcements */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>
              {selectedMosque ? `${selectedMosque.name} — Announcements` : 'Mosque Announcements'}
            </Text>
          </View>
          {announcements.length === 0 ? (
            <View style={s.emptyAnnouncements}>
              <Ionicons name="megaphone-outline" size={32} color={colors.textTertiary} />
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>No announcements</Text>
            </View>
          ) : (
            announcements.map((ann) => (
              <View
                key={ann.id}
                style={[s.announcementCard, { backgroundColor: colors.bgSecondary, borderColor: ann.important ? COLORS.primaryBorder : colors.border },
                  ann.important && { borderLeftWidth: 3, borderLeftColor: COLORS.primary }]}
              >
                <View style={s.annHeader}>
                  <Text style={[s.annTitle, { color: colors.text }]}>{ann.title}</Text>
                  {ann.important && (
                    <View style={s.importantBadge}>
                      <Text style={s.importantText}>Important</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.annBody, { color: colors.textSecondary }]}>{ann.body}</Text>
                <Text style={[s.annDate, { color: colors.textTertiary }]}>
                  {new Date(ann.date).toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '500', marginBottom: 8 },
  hijriToday: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 10, padding: 10 },
  hijriTodayText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  hijriEvent: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 3 },

  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '500' },

  dayHeaders: { flexDirection: 'row', paddingHorizontal: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '500', paddingBottom: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  dayCell: { width: '14.28%', aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingVertical: 4 },
  dayCellSelected: { backgroundColor: COLORS.primary },
  dayCellToday: { backgroundColor: COLORS.primaryBg },
  dayNum: { fontSize: 13 },
  dayHijri: { fontSize: 9, marginTop: 1 },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 2 },

  selectedInfo: { margin: 16, borderRadius: 12, padding: 14, borderWidth: 0.5 },
  selectedGreg: { color: COLORS.primary, fontSize: 14, fontWeight: '500' },
  selectedHijri: { color: COLORS.primaryLight, fontSize: 12, marginTop: 2 },
  eventBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  eventBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '500' },

  section: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyAnnouncements: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13 },

  announcementCard: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5 },
  annHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  annTitle: { fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  importantBadge: { backgroundColor: COLORS.primaryBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  importantText: { color: COLORS.primary, fontSize: 10, fontWeight: '500' },
  annBody: { fontSize: 13, lineHeight: 19 },
  annDate: { fontSize: 11, marginTop: 6 },
});
