import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig, isFirebaseConfigured, missingFirebaseKeys } from './env';

/**
 * Firebase is initialised lazily so that an unconfigured build can still boot
 * and render the setup instructions instead of crashing on the first import.
 */

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export class FirebaseNotConfiguredError extends Error {
  readonly missingKeys: string[];

  constructor(missingKeys: string[]) {
    super(`Firebase is not configured. Missing: ${missingKeys.join(', ')}`);
    this.name = 'FirebaseNotConfiguredError';
    this.missingKeys = missingKeys;
  }
}

export function isFirebaseReady(): boolean {
  return isFirebaseConfigured();
}

export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;

  if (!isFirebaseConfigured()) {
    throw new FirebaseNotConfiguredError(missingFirebaseKeys());
  }

  cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
}

/**
 * Auth with AsyncStorage persistence so a signed-in student stays signed in
 * across app restarts. `initializeAuth` throws if it has already run for the
 * app (which happens on a Fast Refresh), so we fall back to `getAuth`.
 */
export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;

  const app = getFirebaseApp();
  try {
    cachedAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

export function getDb(): Firestore {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getFirebaseApp());
  return cachedDb;
}

/**
 * Turns a Firebase error into a message that makes sense to a student.
 */
export function describeAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return '이메일 주소 형식이 올바르지 않아요.';
    case 'auth/missing-password':
      return '비밀번호를 입력해 주세요.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 해요.';
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일이에요. 로그인해 주세요.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return '이메일 또는 비밀번호가 올바르지 않아요.';
    case 'auth/too-many-requests':
      return '시도가 너무 많아요. 잠시 후 다시 해 주세요.';
    case 'auth/network-request-failed':
      return '네트워크에 연결할 수 없어요.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '구글 로그인이 취소됐어요.';
    case 'auth/popup-blocked':
      return '브라우저가 팝업을 막았어요. 팝업을 허용하고 다시 시도해 주세요.';
    case 'auth/account-exists-with-different-credential':
      return '같은 이메일로 이미 가입돼 있어요. 이메일과 비밀번호로 로그인해 주세요.';
    case 'auth/unauthorized-domain':
      // Setup slip, not a student mistake: the deploy URL is missing from
      // Firebase console → Authentication → Settings → Authorized domains.
      return '이 주소는 로그인 허용 목록에 없어요. 관리자에게 알려 주세요.';
    case 'auth/operation-not-allowed':
      return '이 로그인 방법이 아직 켜져 있지 않아요. 관리자에게 알려 주세요.';
    case 'permission-denied':
      return '권한이 없어요. 다시 로그인해 주세요.';
    case 'unavailable':
      return '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.';
    default:
      break;
  }

  if (error instanceof Error && error.message) return error.message;
  return '알 수 없는 오류가 발생했어요.';
}
