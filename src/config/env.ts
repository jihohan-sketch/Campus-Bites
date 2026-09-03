import Constants from 'expo-constants';

/**
 * Runtime configuration.
 *
 * Values are read from `EXPO_PUBLIC_*` environment variables (inlined by Metro
 * at bundle time from `.env`) and fall back to the `extra` block of app.json,
 * which is what EAS builds usually populate.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function fromExtra(key: string): string {
  const value = extra[key];
  return typeof value === 'string' ? value.trim() : '';
}

function read(envValue: string | undefined, extraKey: string): string {
  return (envValue ?? '').trim() || fromExtra(extraKey);
}

/**
 * NEIS API key. Optional: open.neis.go.kr serves anonymous requests, capped at
 * 100 rows per call, which is plenty for a single school. Supplying a key
 * raises the daily quota.
 */
export const NEIS_API_KEY = read(process.env.EXPO_PUBLIC_NEIS_API_KEY, 'neisApiKey');

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: read(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, 'firebaseApiKey'),
  authDomain: read(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, 'firebaseAuthDomain'),
  projectId: read(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, 'firebaseProjectId'),
  storageBucket: read(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, 'firebaseStorageBucket'),
  messagingSenderId: read(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    'firebaseMessagingSenderId',
  ),
  appId: read(process.env.EXPO_PUBLIC_FIREBASE_APP_ID, 'firebaseAppId'),
};

/** The settings that must be present before Firebase can be initialised. */
const REQUIRED_FIREBASE_KEYS: Array<keyof FirebaseConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

/** Environment variable names matching {@link REQUIRED_FIREBASE_KEYS}. */
export const MISSING_FIREBASE_ENV_NAMES: Record<keyof FirebaseConfig, string> = {
  apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
};

/** Keys that still need a value; empty when the app is fully configured. */
export function missingFirebaseKeys(): Array<keyof FirebaseConfig> {
  return REQUIRED_FIREBASE_KEYS.filter((key) => firebaseConfig[key].length === 0);
}

export const isFirebaseConfigured = (): boolean => missingFirebaseKeys().length === 0;
