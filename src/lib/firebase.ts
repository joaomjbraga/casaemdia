import { initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getRequiredPublicEnv } from '@/lib/env';

const firebaseConfig = {
  apiKey: getRequiredPublicEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getRequiredPublicEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredPublicEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getRequiredPublicEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getRequiredPublicEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getRequiredPublicEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;

function envVarNameFor(key: string) {
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
    '[Firebase] Variáveis de ambiente faltando: ' + missing.join(', ') + '. Verifique o arquivo .env',
  );
}

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

const auth: Auth = isFirstInit
  ? initializeAuth(app, { persistence: browserLocalPersistence })
  : getAuth(app);

export { app, auth };
