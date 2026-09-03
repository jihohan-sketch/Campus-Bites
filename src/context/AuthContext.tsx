import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile as updateAuthProfile,
  type Auth,
  type User,
} from 'firebase/auth';

import {
  FirebaseNotConfiguredError,
  describeAuthError,
  getFirebaseAuth,
  isFirebaseReady,
} from '../config/firebase';
import { APP_SCHOOL_EMAIL_DOMAIN, isSchoolEmail } from '../config/school';
import { ensureProfile, subscribeProfile } from '../services/profile';
import type { UserProfile } from '../types';

/**
 * 구글 로그인은 팝업 흐름이라 웹에서만 동작합니다. 네이티브에서는 버튼을
 * 숨기고 이메일 로그인만 남깁니다 (`expo-auth-session`을 붙이면 열립니다).
 */
const GOOGLE_SIGN_IN_AVAILABLE = Platform.OS === 'web';

const WRONG_DOMAIN_MESSAGE = `학교 계정(@${APP_SCHOOL_EMAIL_DOMAIN})으로만 가입할 수 있어요.`;

export interface AuthContextValue {
  /** True until the persisted session has been restored (or guest mode is ready). */
  initializing: boolean;
  user: User | null;
  profile: UserProfile | null;
  /** False when Firebase env vars are missing — 급식표 still works. */
  firebaseEnabled: boolean;
  /** A recoverable error from the profile listener, if any. */
  profileError: string | null;
  /** False where the Google popup flow cannot run (native). */
  googleAvailable: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const firebaseEnabled = isFirebaseReady();

  /** Tears down the profile listener when the signed-in user changes. */
  const profileUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!firebaseEnabled) {
      setInitializing(false);
      return;
    }

    let auth: Auth;
    try {
      auth = getFirebaseAuth();
    } catch (error) {
      if (error instanceof FirebaseNotConfiguredError) {
        setInitializing(false);
        return;
      }
      throw error;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      profileUnsubscribe.current?.();
      profileUnsubscribe.current = null;

      // The one gate every sign-in path funnels through: a session on the wrong
      // domain is dropped here, whether it came from the Google popup or from a
      // restored session whose account no longer belongs to the school.
      if (nextUser && !isSchoolEmail(nextUser.email ?? '')) {
        setUser(null);
        setProfile(null);
        setProfileError(WRONG_DOMAIN_MESSAGE);
        setInitializing(false);
        void firebaseSignOut(auth);
        return;
      }

      setUser(nextUser);
      setProfileError(null);

      if (!nextUser) {
        setProfile(null);
        setInitializing(false);
        return;
      }

      let cancelled = false;
      ensureProfile(nextUser)
        .then((created) => {
          if (cancelled) return;
          setProfile(created);
          setInitializing(false);
          profileUnsubscribe.current = subscribeProfile(
            nextUser.uid,
            (live) => {
              if (live) setProfile(live);
            },
            (error) => setProfileError(describeAuthError(error)),
          );
        })
        .catch((error) => {
          if (cancelled) return;
          setProfileError(describeAuthError(error));
          setInitializing(false);
        });

      profileUnsubscribe.current = () => {
        cancelled = true;
      };
    });

    return () => {
      unsubscribeAuth();
      profileUnsubscribe.current?.();
      profileUnsubscribe.current = null;
    };
  }, [firebaseEnabled]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!firebaseEnabled) {
      throw new Error('로그인 기능이 아직 준비되지 않았어요.');
    }
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  }, [firebaseEnabled]);

  const signUp = useCallback(
    async (displayName: string, email: string, password: string) => {
      if (!firebaseEnabled) {
        throw new Error('가입 기능이 아직 준비되지 않았어요.');
      }
      if (!isSchoolEmail(email)) {
        throw new Error(WRONG_DOMAIN_MESSAGE);
      }
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );
      const name = displayName.trim();
      if (name) {
        await updateAuthProfile(credential.user, { displayName: name });
      }
      // Create the profile eagerly so the name is stored even if the auth
      // listener fires before `updateProfile` resolves.
      const created = await ensureProfile(credential.user, name);
      setProfile(created);
    },
    [firebaseEnabled],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseEnabled) {
      throw new Error('로그인 기능이 아직 준비되지 않았어요.');
    }
    if (!GOOGLE_SIGN_IN_AVAILABLE) {
      throw new Error('구글 로그인은 웹에서만 쓸 수 있어요. 이메일로 로그인해 주세요.');
    }

    const provider = new GoogleAuthProvider();
    // `hd` makes Google's own chooser offer school accounts first; it is a hint,
    // so the domain is still checked below and again in the security rules.
    provider.setCustomParameters({ hd: APP_SCHOOL_EMAIL_DOMAIN, prompt: 'select_account' });

    const credential = await signInWithPopup(getFirebaseAuth(), provider);
    if (!isSchoolEmail(credential.user.email ?? '')) {
      // The auth listener has already signed this session out; surface why.
      throw new Error(WRONG_DOMAIN_MESSAGE);
    }
  }, [firebaseEnabled]);

  const signOut = useCallback(async () => {
    if (!firebaseEnabled) return;
    profileUnsubscribe.current?.();
    profileUnsubscribe.current = null;
    setProfile(null);
    await firebaseSignOut(getFirebaseAuth());
  }, [firebaseEnabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      user,
      profile,
      firebaseEnabled,
      profileError,
      googleAvailable: GOOGLE_SIGN_IN_AVAILABLE,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [
      initializing,
      user,
      profile,
      firebaseEnabled,
      profileError,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}

/**
 * Convenience accessor for screens that only render once a profile exists.
 * Throws rather than returning null so those screens stay free of null checks.
 */
export function useProfile(): UserProfile {
  const { profile } = useAuth();
  if (!profile) {
    throw new Error('useProfile was called before a profile was loaded.');
  }
  return profile;
}
