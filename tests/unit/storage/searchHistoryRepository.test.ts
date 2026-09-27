import AsyncStorage from "@react-native-async-storage/async-storage";
import { SearchHistoryRepository } from "../../../src/storage/searchHistoryRepository";
import { migrateSearchHistoryPayload } from "../../../src/storage/migrations";
import { STORAGE_KEYS } from "../../../src/storage/keys";

describe("SearchHistoryRepository & Migrations", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("migrateSearchHistoryPayload", () => {
    it("migrates legacy string array payload", () => {
      const legacy = JSON.stringify(["lofi beats", "daft punk", "synthwave"]);
      const migrated = migrateSearchHistoryPayload(legacy);
      expect(migrated).toEqual(["lofi beats", "daft punk", "synthwave"]);
    });

    it("deduplicates and limits legacy array to 20 queries", () => {
      const items = Array.from({ length: 30 }, (_, i) => `query ${i}`);
      items.push("query 0"); // duplicate
      const legacy = JSON.stringify(items);
      const migrated = migrateSearchHistoryPayload(legacy);
      expect(migrated.length).toBe(20);
      expect(new Set(migrated).size).toBe(20);
    });

    it("gracefully recovers from corrupted or invalid JSON", () => {
      expect(migrateSearchHistoryPayload(null)).toEqual([]);
      expect(migrateSearchHistoryPayload("not json")).toEqual([]);
      expect(migrateSearchHistoryPayload("12345")).toEqual([]);
      expect(migrateSearchHistoryPayload("{}")).toEqual([]);
    });

    it("parses valid v1 schema envelope", () => {
      const valid = JSON.stringify({
        version: 1,
        data: {
          terms: ["radiohead", "muse"],
        },
        updatedAt: 12345678,
      });
      const migrated = migrateSearchHistoryPayload(valid);
      expect(migrated).toEqual(["radiohead", "muse"]);
    });
  });

  describe("SearchHistoryRepository CRUD operations", () => {
    it("returns empty array initially when storage is empty", async () => {
      const repo = new SearchHistoryRepository();
      const queries = await repo.load();
      expect(queries).toEqual([]);
    });

    it("adds search queries to the top and persists them", async () => {
      const repo = new SearchHistoryRepository();
      await repo.add("tycho");
      await repo.add("bonobo");

      const queries = await repo.load();
      expect(queries).toEqual(["bonobo", "tycho"]);
    });

    it("moves existing query to the top if re-searched without duplicating", async () => {
      const repo = new SearchHistoryRepository();
      await repo.add("tycho");
      await repo.add("bonobo");
      await repo.add("tycho");

      const queries = await repo.load();
      expect(queries).toEqual(["tycho", "bonobo"]);
      expect(queries.length).toBe(2);
    });

    it("ignores empty or whitespace-only queries", async () => {
      const repo = new SearchHistoryRepository();
      await repo.add("   ");
      await repo.add("");

      const queries = await repo.load();
      expect(queries).toEqual([]);
    });

    it("trims whitespace from queries", async () => {
      const repo = new SearchHistoryRepository();
      await repo.add("  boards of canada  ");

      const queries = await repo.load();
      expect(queries).toEqual(["boards of canada"]);
    });

    it("enforces maximum bound of 20 items", async () => {
      const repo = new SearchHistoryRepository();
      for (let i = 0; i < 25; i++) {
        await repo.add(`band ${i}`);
      }

      const queries = await repo.load();
      expect(queries.length).toBe(20);
      expect(queries[0]).toBe("band 24");
      expect(queries[19]).toBe("band 5");
    });

    it("removes an individual query", async () => {
      const repo = new SearchHistoryRepository();
      await repo.add("daft punk");
      await repo.add("justice");
      await repo.remove("daft punk");

      const queries = await repo.load();
      expect(queries).toEqual(["justice"]);
    });

    it("clears search history completely", async () => {
      const repo = new SearchHistoryRepository();
      await repo.add("aphex twin");
      await repo.add("four tet");

      await repo.clear();
      const queries = await repo.load();
      expect(queries).toEqual([]);

      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      expect(raw).toBeNull();
    });
  });
});
