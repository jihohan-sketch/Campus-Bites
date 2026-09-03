import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
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
import { ensureProfile, subscribeProfile } from '../services/profile';
import type { UserProfile } from '../types';

export interface AuthContextValue {
  /** True until the persisted session has been restored (or guest mode is ready). */
  initializing: boolean;
  user: User | null;
  profile: UserProfile | null;
  /** False when Firebase env vars are missing — 급식표 still works. */
  firebaseEnabled: boolean;
  /** A recoverable error from the profile listener, if any. */
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
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
    [],
  );

  const signOut = useCallback(async () => {
    if (!firebaseEnabled) return;
    profileUnsubscribe.current?.();
    profileUnsubscribe.current = null;
    setProfile(null);
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      user,
      profile,
      firebaseEnabled,
      profileError,
      signIn,
      signUp,
      signOut,
    }),
    [initializing, user, profile, firebaseEnabled, profileError, signIn, signUp, signOut],
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
