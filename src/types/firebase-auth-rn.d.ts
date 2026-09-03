import type { Persistence } from 'firebase/auth';

/**
 * `getReactNativePersistence` only exists on the React Native entry point of
 * `@firebase/auth`, which Metro resolves at runtime via the package's
 * `react-native` export condition. TypeScript, however, matches the `types`
 * condition first and lands on the browser type bundle, where the symbol is
 * absent. The top level import above makes this file a module, so the block
 * below *augments* `firebase/auth` instead of replacing it.
 */
declare module 'firebase/auth' {
  /** The subset of AsyncStorage's API that Firebase persistence relies on. */
  export interface ReactNativeAsyncStorageLike {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorageLike,
  ): Persistence;
}
