import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, type Unsubscribe } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBrF9-KghkUZbdS_HcqARfUDGaxlYjvRLc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "plant-monitoring-system-ca35f.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://plant-monitoring-system-ca35f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "plant-monitoring-system-ca35f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "plant-monitoring-system-ca35f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "210678468472",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:210678468472:web:ee6f5300b2d88389d1028d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-4Y5ZEEMHNE",
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

export type FirebasePlantData = Record<string, unknown>;

export function subscribeToPlantData(
  onData: (data: FirebasePlantData) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const databasePath = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_PATH || "plant";

  return onValue(
    ref(database, databasePath),
    (snapshot) => {
      const value = snapshot.val();
      if (value && typeof value === "object" && !Array.isArray(value)) {
        onData(value as FirebasePlantData);
      }
    },
    (error) => onError?.(error),
  );
}