// src/screens/OnboardingScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useTheme, COLORS } from '../utils/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'moon',
    iconColor: '#4f46e5',
    bg: '#eef2ff',
    title: 'Benvenuto in\nMasjidConnect',
    titleAr: 'مرحباً بك',
    subtitle: 'L\'app islamica completa per la tua vita quotidiana. Orari di preghiera, Quran, Qibla e molto altro.',
  },
  {
    id: '2',
    icon: 'location',
    iconColor: COLORS.primary,
    bg: '#e1f5ee',
    title: 'Trova la tua\nMoschea',
    titleAr: 'ابحث عن مسجدك',
    subtitle: 'Trova le moschee vicino a te con la geolocalizzazione automatica. Gli imam inseriscono gli orari reali di Salat e Iqama.',
  },
  {
    id: '3',
    icon: 'time',
    iconColor: '#f59e0b',
    bg: '#fef3c7',
    title: 'Orari\nPrecisi',
    titleAr: 'أوقات دقيقة',
    subtitle: 'Orari di preghiera calcolati con il metodo Muslim World League. Notifiche Adhan personalizzabili per ogni preghiera.',
  },
  {
    id: '4',
    icon: 'book',
    iconColor: '#059669',
    bg: '#ecfdf5',
    title: 'Quran & Strumenti\nIslamici',
    titleAr: 'القرآن والأدوات الإسلامية',
    subtitle: 'Al-Quran con traduzione italiana, Dua per ogni occasione, 99 nomi di Allah, contatore Dhikr e calendario Hijri.',
  },
  {
    id: '5',
    icon: 'compass',
    iconColor: '#8b5cf6',
    bg: '#f5f3ff',
    title: 'Bussola Qibla\ne Molto Altro',
    titleAr: 'بوصلة القبلة',
    subtitle: 'Trova la direzione della Mecca ovunque tu sia nel mondo. MasjidConnect è completamente gratuita e senza pubblicità.',
  },
];

export default function OnboardingScreen({ onComplete }) {
  const { colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [locationRequested, setLocationRequested] = useState(false);
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function goToSlide(index) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setCurrentSlide(index);
      scrollRef.current?.scrollTo({ x: index * width, animated: false });
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  function next() {
    if (currentSlide < SLIDES.length - 1) goToSlide(currentSlide + 1);
  }

  function prev() {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  }

  async function handleRequestLocation() {
    setLocationRequested(true);
    await Location.requestForegroundPermissionsAsync();
    next();
  }

  async function handleComplete() {
    await AsyncStorage.setItem('onboarding_done', '1');
    onComplete?.();
  }

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;
  const isLocationSlide = currentSlide === 1;

  const s = styles(colors);

  return (
    <View style={[s.container, { backgroundColor: slide.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={slide.bg} />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={s.skipBtn} onPress={handleComplete}>
          <Text style={s.skipText}>Salta</Text>
        </TouchableOpacity>
      )}

      {/* Slide content */}
      <Animated.View style={[s.slideContent, { opacity: fadeAnim }]}>
        {/* Icon */}
        <View style={[s.iconCircle, { backgroundColor: slide.iconColor + '20' }]}>
          <View style={[s.iconCircleInner, { backgroundColor: slide.iconColor + '30' }]}>
            <Ionicons name={slide.icon} size={56} color={slide.iconColor} />
          </View>
        </View>

        {/* Arabic text */}
        <Text style={[s.titleAr, { color: slide.iconColor }]}>{slide.titleAr}</Text>

        {/* Title */}
        <Text style={s.title}>{slide.title}</Text>

        {/* Subtitle */}
        <Text style={s.subtitle}>{slide.subtitle}</Text>

        {/* Location request on slide 2 */}
        {isLocationSlide && !locationRequested && (
          <TouchableOpacity
            style={[s.locationBtn, { backgroundColor: slide.iconColor }]}
            onPress={handleRequestLocation}
          >
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={s.locationBtnText}>Abilita posizione</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Dots indicator */}
      <View style={s.dotsRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goToSlide(i)}
            style={[s.dot, i === currentSlide && [s.dotActive, { backgroundColor: slide.iconColor }]]}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={s.navRow}>
        {currentSlide > 0 ? (
          <TouchableOpacity style={[s.navBtn, { borderColor: slide.iconColor }]} onPress={prev}>
            <Ionicons name="arrow-back" size={20} color={slide.iconColor} />
          </TouchableOpacity>
        ) : <View style={{ width: 52 }} />}

        <TouchableOpacity
          style={[s.nextBtn, { backgroundColor: slide.iconColor }]}
          onPress={isLast ? handleComplete : (isLocationSlide && !locationRequested ? handleRequestLocation : next)}
        >
          {isLast ? (
            <>
              <Text style={s.nextBtnText}>Inizia</Text>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </>
          ) : (
            <>
              <Text style={s.nextBtnText}>
                {isLocationSlide && !locationRequested ? 'Abilita GPS' : 'Avanti'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (c) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  skipBtn: { position: 'absolute', top: 56, right: 24, padding: 8 },
  skipText: { color: '#888', fontSize: 14 },
  slideContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  iconCircle: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconCircleInner: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  titleAr: { fontSize: 20, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 16, lineHeight: 36 },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24, paddingHorizontal: 8 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, marginTop: 24 },
  locationBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  dotActive: { width: 24, borderRadius: 4 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingBottom: 40 },
  navBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 26, paddingVertical: 14, paddingHorizontal: 24 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
