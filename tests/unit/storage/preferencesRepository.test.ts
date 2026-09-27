import AsyncStorage from "@react-native-async-storage/async-storage";
import { PreferencesRepository } from "../../../src/storage/preferencesRepository";
import { migratePreferencesPayload } from "../../../src/storage/migrations";
import { INITIAL_PREFERENCES_DATA } from "../../../src/storage/schemas";
import { STORAGE_KEYS } from "../../../src/storage/keys";

describe("PreferencesRepository & Migrations", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("migratePreferencesPayload", () => {
    it("returns default preferences for null or empty input", () => {
      expect(migratePreferencesPayload(null)).toEqual(INITIAL_PREFERENCES_DATA);
      expect(migratePreferencesPayload("")).toEqual(INITIAL_PREFERENCES_DATA);
    });

    it("returns default preferences for malformed JSON", () => {
      expect(migratePreferencesPayload("{ corrupt")).toEqual(
        INITIAL_PREFERENCES_DATA,
      );
      expect(migratePreferencesPayload("42")).toEqual(INITIAL_PREFERENCES_DATA);
    });

    it("parses valid preferences payload preserving valid overrides", () => {
      const payload = JSON.stringify({
        seekIntervalSeconds: 15,
        autoplay: false,
        enableDiscoverMix: false,
        displayName: "Audiophile",
      });
      const migrated = migratePreferencesPayload(payload);
      expect(migrated.seekIntervalSeconds).toBe(15);
      expect(migrated.autoplay).toBe(false);
      expect(migrated.enableDiscoverMix).toBe(false);
      expect(migrated.displayName).toBe("Audiophile");
    });

    it("applies defaults for missing fields in partial payload", () => {
      const payload = JSON.stringify({
        seekIntervalSeconds: 30,
      });
      const migrated = migratePreferencesPayload(payload);
      expect(migrated.seekIntervalSeconds).toBe(30);
      expect(migrated.autoplay).toBe(true);
      expect(migrated.enableDiscoverMix).toBe(true);
    });
  });

  describe("PreferencesRepository CRUD operations", () => {
    it("loads default preferences when nothing has been stored", async () => {
      const repo = new PreferencesRepository();
      const prefs = await repo.load();
      expect(prefs).toEqual(INITIAL_PREFERENCES_DATA);
    });

    it("updates specific preferences and persists changes", async () => {
      const repo = new PreferencesRepository();
      const updated = await repo.save({
        seekIntervalSeconds: 5,
        autoplay: false,
      });
      expect(updated.seekIntervalSeconds).toBe(5);
      expect(updated.autoplay).toBe(false);
      expect(updated.enableDiscoverMix).toBe(true);

      const reloaded = await repo.load();
      expect(reloaded.seekIntervalSeconds).toBe(5);
      expect(reloaded.autoplay).toBe(false);

      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!).data.seekIntervalSeconds).toBe(5);
    });

    it("clears preferences back to defaults", async () => {
      const repo = new PreferencesRepository();
      await repo.save({ seekIntervalSeconds: 30, displayName: "Custom" });
      await repo.clear();

      const loaded = await repo.load();
      expect(loaded).toEqual(INITIAL_PREFERENCES_DATA);
    });
  });
});
