// src/utils/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  GeoPoint,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import {
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBqHMnTHlgQG11WLX4lzpiu9AmNStES6hc",
  authDomain: "masjid-adhan.firebaseapp.com",
  projectId: "masjid-adhan",
  storageBucket: "masjid-adhan.firebasestorage.app",
  messagingSenderId: "425754318220",
  appId: "1:425754318220:web:d7f07cc320a6cbe27fb2a9",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export async function fetchAllMosques() {
  try {
    const snap = await getDocs(collection(db, 'mosques'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('fetchAllMosques error:', err.message);
    return [];
  }
}

export async function fetchMosque(mosqueId) {
  try {
    const snap = await getDoc(doc(db, 'mosques', mosqueId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.warn('fetchMosque error:', err.message);
    return null;
  }
}

export async function updateMosqueTimes(mosqueId, timesData, iqamaData) {
  await updateDoc(doc(db, 'mosques', mosqueId), {
    prayerTimes: timesData,
    iqamaTimes: iqamaData,
    updatedAt: serverTimestamp(),
  });
}

export async function createMosque(data) {
  const ref = doc(collection(db, 'mosques'));
  await setDoc(ref, {
    ...data,
    location: new GeoPoint(data.lat, data.lng),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function adminLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function adminLogout() {
  return signOut(auth);
}
