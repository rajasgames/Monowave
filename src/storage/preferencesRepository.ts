import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./keys";
import { PreferencesData, INITIAL_PREFERENCES_DATA } from "./schemas";
import {
  migratePreferencesPayload,
  createPersistedEnvelope,
} from "./migrations";

export class PreferencesRepository {
  private inMemoryCache: PreferencesData | null = null;
  private readonly listeners = new Set<(prefs: PreferencesData) => void>();

  async load(): Promise<PreferencesData> {
    if (this.inMemoryCache) {
      return { ...this.inMemoryCache };
    }
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      this.inMemoryCache = migratePreferencesPayload(raw);
    } catch {
      this.inMemoryCache = { ...INITIAL_PREFERENCES_DATA };
    }
    return { ...this.inMemoryCache };
  }

  async save(updates: Partial<PreferencesData>): Promise<PreferencesData> {
    const current = await this.load();
    const updated: PreferencesData = {
      ...current,
      ...updates,
    };
    this.inMemoryCache = updated;
    this.notify(updated);
    try {
      const envelope = createPersistedEnvelope(updated);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify(envelope),
      );
    } catch {
      /* Safe failure */
    }
    return { ...updated };
  }

  async clear(): Promise<void> {
    this.inMemoryCache = { ...INITIAL_PREFERENCES_DATA };
    this.notify(this.inMemoryCache);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    } catch {
      /* Safe failure */
    }
  }

  subscribe(listener: (prefs: PreferencesData) => void): () => void {
    this.listeners.add(listener);
    if (this.inMemoryCache) {
      listener({ ...this.inMemoryCache });
    }
    return () => this.listeners.delete(listener);
  }

  private notify(data: PreferencesData) {
    for (const listener of this.listeners) {
      try {
        listener({ ...data });
      } catch {
        /* Ignore listener errors */
      }
    }
  }
}

export const defaultPreferencesRepository = new PreferencesRepository();
