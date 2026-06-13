# MasjidConnect 🕌

App mobile gratuita e senza pubblicità per connettere i fedeli alle proprie moschee locali.

## Caratteristiche
- ✅ Orari Salat & Iqama inseriti direttamente dalle moschee
- ✅ Notifiche Adhan (Makkah, Madinah, Al-Aqsa, Silenzio)
- ✅ Ricerca moschee con geolocalizzazione + mappa
- ✅ Bussola Qibla (con sensore magnetometro)
- ✅ 5 lingue: 🇮🇹 Italiano · 🇬🇧 English · 🇸🇦 العربية · 🇫🇷 Français · 🇪🇸 Español
- ✅ Dark mode automatica
- ✅ Pannello admin per gli imam (aggiornamento orari via app)

---

## Setup

### 1. Prerequisiti
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Account [Firebase](https://firebase.google.com) (gratuito)
- (Opzionale) Account [Expo](https://expo.dev) per le build

### 2. Installazione

```bash
cd MasjidConnect
npm install
```

### 3. Configura Firebase

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com)
2. Abilita **Firestore Database** (modo produzione)
3. Abilita **Authentication** → Email/Password
4. Copia la config e sostituisci in `src/utils/firebase.js`:

```js
const firebaseConfig = {
  apiKey: 'la-tua-chiave',
  authDomain: 'tuo-progetto.firebaseapp.com',
  projectId: 'tuo-progetto-id',
  storageBucket: 'tuo-progetto.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123:web:abc',
};
```

### 4. Regole Firestore

Vai su Firestore → Regole e incolla:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tutti possono leggere le moschee
    match /mosques/{mosqueId} {
      allow read: if true;
      // Solo l'admin della moschea può scrivere
      allow write: if request.auth != null
        && request.auth.uid == resource.data.adminUid;
      // Creazione nuova moschea: solo utenti autenticati
      allow create: if request.auth != null;
    }
  }
}
```

### 5. Aggiungi la prima moschea (Firestore)

Crea un documento nella collection `mosques`:

```json
{
  "name": "Moschea Al-Noor",
  "address": "Via Roma 14, Genova",
  "city": "Genova",
  "country": "Italy",
  "lat": 44.4056,
  "lng": 8.9463,
  "phone": "+39 010 123456",
  "imam": "Sheikh Abdullah",
  "capacity": 200,
  "womenSection": true,
  "prayerTimes": {
    "fajr": "05:12",
    "shuruq": "06:48",
    "dhuhr": "13:35",
    "asr": "17:08",
    "maghrib": "20:14",
    "isha": "22:00",
    "jumuah": "13:30"
  },
  "iqamaTimes": {
    "fajr": "05:30",
    "dhuhr": "13:45",
    "asr": "17:20",
    "maghrib": "20:24",
    "isha": "22:15"
  },
  "adminUid": "UID_DELL_ADMIN_DA_FIREBASE_AUTH"
}
```

### 6. Crea account admin per l'imam

In Firebase Console → Authentication → Users → Aggiungi utente (email + password).
Copia l'UID e aggiungilo al campo `adminUid` del documento della moschea.

---

## Avvio in sviluppo

```bash
npx expo start
```

Poi scansiona il QR code con l'app **Expo Go** sul tuo telefono.

---

## Build production

### Android APK
```bash
npx eas build --platform android --profile preview
```

### iOS
```bash
npx eas build --platform ios
```

> Richiede account EAS (gratuito per progetti personali): `npm install -g eas-cli && eas login`

---

## Struttura del progetto

```
MasjidConnect/
├── App.js                          # Entry point
├── app.json                        # Config Expo
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js           # Orari preghiera + prossima preghiera
│   │   ├── MosquesScreen.js        # Ricerca moschee + mappa
│   │   ├── MosqueDetailScreen.js   # Dettaglio moschea
│   │   ├── QiblaScreen.js          # Bussola Qibla + scelta Adhan
│   │   ├── ProfileScreen.js        # Impostazioni + lingua
│   │   └── AdminScreen.js          # Pannello admin per imam
│   ├── navigation/
│   │   └── AppNavigator.js         # Tab + Stack navigation
│   ├── context/
│   │   └── AppContext.js           # Stato globale dell'app
│   └── utils/
│       ├── firebase.js             # Firestore helpers
│       ├── prayerTimes.js          # Calcolo orari (adhan library)
│       ├── i18n.js                 # Traduzioni 5 lingue
│       └── theme.js                # Colori light/dark
```

---

## Come funziona il sistema degli orari

```
Moschea ha orari propri?
    ↓ SÌ                    ↓ NO
Usa orari da Firestore    Calcola con libreria adhan
(inseriti dall'imam)      (basati su posizione GPS)
        ↓                         ↓
   PRECISIONE 100%          Stima algoritmica
   (badge verificato)       (fallback)
```

---

## Prossime funzionalità (v2)
- [ ] Calendario Hijri
- [ ] Contatore Dhikr
- [ ] Annunci moschea (bacheca)
- [ ] Condivisione orari su WhatsApp
- [ ] Widget schermata home (iOS/Android)
- [ ] Geohash per query geografiche Firestore scalabili
