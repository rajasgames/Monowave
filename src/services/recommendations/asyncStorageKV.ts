import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureKV } from './storage';

/** Bridges the engine's KV abstraction to AsyncStorage. Call once at app startup. */
export function bindRecoStorageToAsyncStorage(): void {
  configureKV({
    get: key => AsyncStorage.getItem(key),
    set: (key, value) => AsyncStorage.setItem(key, value),
  });
}
