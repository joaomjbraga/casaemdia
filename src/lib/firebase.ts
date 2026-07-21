import { initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;

function envVarNameFor(key: string) {
  // converte camelCase -> UPPER_SNAKE (apiKey -> API_KEY)
  return 'EXPO_PUBLIC_FIREBASE_' + key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

const missing: string[] = [];
for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    missing.push(envVarNameFor(key));
  }
}
if (missing.length > 0) {
  throw new Error(
    `[Firebase] Variáveis de ambiente faltando: ${missing.join(', ')}. Verifique o arquivo .env`,
  );
}

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
  auth = isFirstInit
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      })
    : getAuth(app);
} catch {
  auth = getAuth(app);
}

let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: { kind: 'persistent' },
  });
} catch {
  db = getFirestore(app);
}

export { auth, db };
