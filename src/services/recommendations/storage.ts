/**
 * Minimal key/value abstraction so the recommendation engine never imports
 * React Native directly. The app binds AsyncStorage at startup
 * (see asyncStorageKV.ts); Node tests inject an in-memory backend instead.
 */
export type KVStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
};

const memoryBackends = new Map<string, Map<string, string>>();

/** Fresh in-memory backend (used by tests and as a safe fallback). */
export function memoryKV(persist = false, name = "default"): KVStore {
  let store = persist ? memoryBackends.get(name) : undefined;
  if (!store) {
    store = new Map();
    if (persist) memoryBackends.set(name, store);
  }
  return {
    get: async (key) => store!.get(key) ?? null,
    set: async (key, value) => {
      store!.set(key, value);
    },
  };
}

let backend: KVStore = memoryKV();

export function configureKV(store: KVStore): void {
  backend = store;
}

export function getKV(): KVStore {
  return backend;
}
