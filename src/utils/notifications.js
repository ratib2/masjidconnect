// src/utils/notifications.js
// Sistema notifiche Adhan completo con suono reale
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurazione del comportamento delle notifiche in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Nomi delle preghiere in più lingue
const PRAYER_NAMES = {
  fajr:    { it: 'Fajr', ar: 'الفجر', en: 'Fajr' },
  shuruq:  { it: 'Shuruq', ar: 'الشروق', en: 'Sunrise' },
  dhuhr:   { it: 'Dhuhr', ar: 'الظهر', en: 'Dhuhr' },
  asr:     { it: 'Asr', ar: 'العصر', en: 'Asr' },
  maghrib: { it: 'Maghrib', ar: 'المغرب', en: 'Maghrib' },
  isha:    { it: 'Isha', ar: 'العشاء', en: 'Isha' },
  jumuah:  { it: "Jumu'ah", ar: 'الجمعة', en: "Jumu'ah" },
};

/**
 * Richiede i permessi per le notifiche
 * @returns {boolean} true se i permessi sono stati concessi
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Pianifica le notifiche Adhan per i prossimi 7 giorni
 * @param {object} prayerTimes - { fajr, dhuhr, asr, maghrib, isha }
 * @param {object} iqamaTimes - { fajr, dhuhr, asr, maghrib, isha }
 * @param {object} settings - { enabled, prayers, minutesBefore, language }
 */
export async function scheduleAdhanNotifications(prayerTimes, iqamaTimes = {}, settings = {}) {
  const {
    enabled = true,
    prayers = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    minutesBefore = 0,
    language = 'it',
    mosqueName = null,
  } = settings;

  // Cancella tutte le notifiche precedenti
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const now = new Date();
  const scheduledIds = [];

  // Pianifica per i prossimi 7 giorni
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + dayOffset);

    for (const [prayerKey, enabled] of Object.entries(prayers)) {
      if (!enabled || !prayerTimes[prayerKey]) continue;
      if (prayerKey === 'shuruq') continue; // Shuruq non ha Adhan

      const [h, m] = prayerTimes[prayerKey].split(':').map(Number);
      const triggerDate = new Date(targetDate);
      triggerDate.setHours(h, m - minutesBefore, 0, 0);

      // Salta se è nel passato
      if (triggerDate <= now) continue;

      const prayerName = PRAYER_NAMES[prayerKey]?.[language] || prayerKey;
      const iqamaTime = iqamaTimes[prayerKey];

      let body = `🕌 ${prayerTimes[prayerKey]}`;
      if (iqamaTime) body += ` · Iqama: ${iqamaTime}`;
      if (minutesBefore > 0) body = `Tra ${minutesBefore} minuti · ${body}`;
      if (mosqueName) body += `\n${mosqueName}`;

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `🕌 ${prayerName}`,
            body,
            sound: true, // Usa il suono di sistema (personalizzabile con file audio)
            priority: Notifications.AndroidNotificationPriority.HIGH,
            color: '#0f6e56',
            vibrate: [0, 250, 250, 250],
          },
          trigger: {
            date: triggerDate,
          },
        });
        scheduledIds.push(id);
      } catch (err) {
        console.warn(`Failed to schedule ${prayerKey} notification:`, err.message);
      }
    }
  }

  // Salva gli ID per poterle cancellare
  await AsyncStorage.setItem('notification_ids', JSON.stringify(scheduledIds));
  console.log(`Scheduled ${scheduledIds.length} Adhan notifications`);
  return scheduledIds;
}

/**
 * Cancella tutte le notifiche Adhan
 */
export async function cancelAllAdhanNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem('notification_ids');
}

/**
 * Ottieni le notifiche pianificate
 */
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Listener per notifiche ricevute mentre l'app è aperta
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listener per quando l'utente tocca la notifica
 */
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
