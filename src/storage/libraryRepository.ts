import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./keys";
import { LibraryData, INITIAL_LIBRARY_DATA } from "./schemas";
import { migrateLibraryPayload, createPersistedEnvelope } from "./migrations";

export class LibraryRepository {
  private inMemoryCache: LibraryData | null = null;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly listeners = new Set<(data: LibraryData) => void>();

  async load(): Promise<LibraryData> {
    if (this.inMemoryCache) {
      return this.inMemoryCache;
    }

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.LIBRARY);
      this.inMemoryCache = migrateLibraryPayload(raw);
    } catch {
      this.inMemoryCache = { ...INITIAL_LIBRARY_DATA };
    }

    return this.inMemoryCache;
  }

  save(data: LibraryData): Promise<void> {
    this.inMemoryCache = data;
    this.notify(data);

    return new Promise((resolve, reject) => {
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
      }

      this.saveDebounceTimer = setTimeout(async () => {
        try {
          const envelope = createPersistedEnvelope(data);
          await AsyncStorage.setItem(
            STORAGE_KEYS.LIBRARY,
            JSON.stringify(envelope),
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 350);
    });
  }

  async clear(): Promise<void> {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.inMemoryCache = { ...INITIAL_LIBRARY_DATA };
    this.notify(this.inMemoryCache);
    await AsyncStorage.removeItem(STORAGE_KEYS.LIBRARY);
  }

  subscribe(listener: (data: LibraryData) => void): () => void {
    this.listeners.add(listener);
    if (this.inMemoryCache) {
      listener(this.inMemoryCache);
    }
    return () => this.listeners.delete(listener);
  }

  private notify(data: LibraryData) {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch {
        /* Ignore listener errors */
      }
    }
  }
}

export const defaultLibraryRepository = new LibraryRepository();
