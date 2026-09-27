import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./keys";
import {
  migrateSearchHistoryPayload,
  createPersistedEnvelope,
} from "./migrations";

export class SearchHistoryRepository {
  private inMemoryCache: string[] | null = null;
  private readonly listeners = new Set<(history: string[]) => void>();

  async load(): Promise<string[]> {
    if (this.inMemoryCache) {
      return [...this.inMemoryCache];
    }
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      this.inMemoryCache = migrateSearchHistoryPayload(raw);
    } catch {
      this.inMemoryCache = [];
    }
    return [...this.inMemoryCache];
  }

  async add(term: string): Promise<string[]> {
    const clean = term.trim();
    if (!clean) {
      return this.load();
    }
    const current = await this.load();
    const updated = [
      clean,
      ...current.filter((t) => t.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, 20);
    this.inMemoryCache = updated;
    this.notify(updated);
    try {
      const envelope = createPersistedEnvelope({ terms: updated });
      await AsyncStorage.setItem(
        STORAGE_KEYS.SEARCH_HISTORY,
        JSON.stringify(envelope),
      );
    } catch {
      /* Safe failure: in-memory state preserved */
    }
    return [...updated];
  }

  async remove(term: string): Promise<string[]> {
    const current = await this.load();
    const updated = current.filter(
      (t) => t.toLowerCase() !== term.toLowerCase().trim(),
    );
    this.inMemoryCache = updated;
    this.notify(updated);
    try {
      const envelope = createPersistedEnvelope({ terms: updated });
      await AsyncStorage.setItem(
        STORAGE_KEYS.SEARCH_HISTORY,
        JSON.stringify(envelope),
      );
    } catch {
      /* Safe failure */
    }
    return [...updated];
  }

  async clear(): Promise<void> {
    this.inMemoryCache = [];
    this.notify([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
    } catch {
      /* Safe failure */
    }
  }

  subscribe(listener: (history: string[]) => void): () => void {
    this.listeners.add(listener);
    if (this.inMemoryCache) {
      listener([...this.inMemoryCache]);
    }
    return () => this.listeners.delete(listener);
  }

  private notify(data: string[]) {
    for (const listener of this.listeners) {
      try {
        listener([...data]);
      } catch {
        /* Ignore listener errors */
      }
    }
  }
}

export const defaultSearchHistoryRepository = new SearchHistoryRepository();
