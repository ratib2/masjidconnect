// src/screens/QiblaScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polygon, Text as SvgText, G } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { useTheme, COLORS } from '../utils/theme';
import { calculateQibla } from '../utils/prayerTimes';

const ADHAN_OPTIONS = ['adhan_makkah', 'adhan_madinah', 'adhan_aqsa', 'adhan_silent', 'adhan_default'];

export default function QiblaScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { location, qiblaDistance, adhanSound, updateSetting } = useApp();

  const [heading, setHeading] = useState(0);          // device heading from North
  const [qiblaAngle, setQiblaAngle] = useState(null); // degrees from North
  const [magnetometerAvailable, setMagnetometerAvailable] = useState(true);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const prevHeading = useRef(0);

  useEffect(() => {
    if (location) {
      const angle = calculateQibla(location.lat, location.lng);
      setQiblaAngle(angle);
    }
  }, [location]);

  useEffect(() => {
    let sub;
    Magnetometer.isAvailableAsync().then((ok) => {
      setMagnetometerAvailable(ok);
      if (!ok) return;
      Magnetometer.setUpdateInterval(100);
      sub = Magnetometer.addListener(({ x, y }) => {
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        angle = (angle + 360) % 360; // 0–360
        setHeading(angle);
        // Smooth rotation
        const delta = angle - prevHeading.current;
        const adj = delta > 180 ? delta - 360 : delta < -180 ? delta + 360 : delta;
        prevHeading.current = angle;
        Animated.spring(rotateAnim, { toValue: rotateAnim._value + adj, useNativeDriver: true, tension: 80, friction: 10 }).start();
      });
    });
    return () => sub?.remove();
  }, []);

  // Direction from device toward Qibla
  const arrowAngle = qiblaAngle != null ? (qiblaAngle - heading + 360) % 360 : 0;

  const s = styles(colors);
  const SIZE = 220;
  const CX = SIZE / 2;
  const R = SIZE / 2 - 10;

  const cardinals = ['N', 'E', 'S', 'W'];
  const cardinalPositions = cardinals.map((label, i) => {
    const a = (i * 90 * Math.PI) / 180;
    return { label, x: CX + (R - 18) * Math.sin(a), y: CX - (R - 18) * Math.cos(a) };
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('qiblaDirection')}</Text>
        <Text style={s.headerSub}>
          {location?.city ? t('qiblaFrom', { city: location.city }) : ''}
        </Text>
        {qiblaAngle != null && (
          <View style={s.angleCard}>
            <Text style={s.angleDeg}>{t('degrees', { deg: Math.round(qiblaAngle) })}</Text>
            {qiblaDistance && (
              <Text style={s.angleSub}>{t('makkahDistance', { dist: qiblaDistance })}</Text>
            )}
          </View>
        )}
      </View>

      {/* Compass */}
      <View style={s.compassWrap}>
        {!magnetometerAvailable && (
          <Text style={[s.calibText, { color: colors.textTertiary }]}>{t('compassCalibration')}</Text>
        )}
        <Svg width={SIZE} height={SIZE}>
          {/* Outer ring */}
          <Circle cx={CX} cy={CX} r={R} fill={colors.bgCard} stroke={colors.border} strokeWidth="0.5" />
          <Circle cx={CX} cy={CX} r={R * 0.72} fill="none" stroke={colors.border} strokeWidth="0.5" />

          {/* Tick marks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            const isMajor = i % 9 === 0;
            const r1 = R - (isMajor ? 14 : 8);
            return (
              <Line
                key={i}
                x1={CX + R * Math.sin(a)}
                y1={CX - R * Math.cos(a)}
                x2={CX + r1 * Math.sin(a)}
                y2={CX - r1 * Math.cos(a)}
                stroke={colors.border}
                strokeWidth={isMajor ? 1.5 : 0.5}
              />
            );
          })}

          {/* Cardinal labels */}
          {cardinalPositions.map(({ label, x, y }) => (
            <SvgText key={label} x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="500"
              fill={label === 'N' ? '#d85a30' : colors.textSecondary}>{label}</SvgText>
          ))}

          {/* Qibla arrow */}
          <G rotation={arrowAngle} origin={`${CX}, ${CX}`}>
            <Line x1={CX} y1={CX + 30} x2={CX} y2={CX - R * 0.7} stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round" />
            <Polygon points={`${CX},${CX - R * 0.7 - 12} ${CX - 7},${CX - R * 0.7} ${CX + 7},${CX - R * 0.7}`} fill={COLORS.primary} />
            <Circle cx={CX} cy={CX + 30} r={5} fill={colors.border} />
          </G>

          {/* North indicator */}
          <G rotation={0} origin={`${CX}, ${CX}`}>
            <Line x1={CX} y1={CX - R * 0.4} x2={CX} y2={CX - R * 0.68} stroke="#d85a30" strokeWidth="1.5" strokeDasharray="3,3" strokeLinecap="round" />
          </G>

          {/* Center dot */}
          <Circle cx={CX} cy={CX} r={5} fill={COLORS.primary} />
        </Svg>

        {/* Kaaba label */}
        <View style={s.kaabaLabel}>
          <Ionicons name="location" size={13} color={COLORS.primary} />
          <Text style={s.kaabaText}>Kaaba</Text>
        </View>
      </View>

      {/* calibration hint if no magnetometer */}
      {!magnetometerAvailable && (
        <View style={s.noBanner}>
          <Ionicons name="warning-outline" size={16} color="#ba7517" />
          <Text style={s.noText}>{t('compassCalibration')}</Text>
        </View>
      )}

      {/* Adhan selector */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>{t('chooseAdhan')}</Text>
        <View style={s.adhanGrid}>
          {ADHAN_OPTIONS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[s.adhanChip, adhanSound === key && s.adhanChipActive]}
              onPress={() => updateSetting('adhanSound', key)}
            >
              <Text style={[s.adhanText, adhanSound === key && s.adhanTextActive]}>
                {t(key)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (c) => StyleSheet.create({
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '500' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  angleCard: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 12, padding: 12, marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  angleDeg: { color: '#fff', fontSize: 28, fontWeight: '500' },
  angleSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },

  compassWrap: { alignItems: 'center', paddingVertical: 24 },
  calibText: { fontSize: 12, marginBottom: 8, textAlign: 'center', paddingHorizontal: 20 },
  kaabaLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  kaabaText: { color: COLORS.primary, fontSize: 12 },

  noBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, backgroundColor: '#faeeda', borderRadius: 10, padding: 10, borderWidth: 0.5, borderColor: '#fac775' },
  noText: { color: '#854f0b', fontSize: 12, flex: 1 },

  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  adhanGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  adhanChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.bgSecondary, borderWidth: 0.5, borderColor: c.border },
  adhanChipActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder },
  adhanText: { fontSize: 13, color: c.textSecondary },
  adhanTextActive: { color: COLORS.primary, fontWeight: '500' },
});
