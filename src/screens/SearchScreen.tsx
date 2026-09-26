import React, { useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MagnifyingGlass, CaretRight } from "phosphor-react-native";
import { usePlayer } from "../state/PlayerContext";
import { ScreenTitle, SearchBox, SectionHeader, TrackRow as TrackLine } from "../ui/components";
import { C } from "../ui/theme";
import { searchMusic } from "../music";
import type { SearchItem } from "../music";
import type { TabScreenProps } from "../navigation/types";
import type { Track } from "../music";

type Filter = "all" | "track" | "album" | "artist" | "playlist";

const MOODS = [
  { label: "Relax", icon: "☁️", tint: "#5C8BFF30", query: "chill lofi focus" },
  { label: "Workout", icon: "⚡", tint: "#FF453A30", query: "workout hype" },
  { label: "Focus", icon: "🧠", tint: "#32ADE630", query: "deep focus study" },
  { label: "Party", icon: "🎉", tint: "#FF9F0A30", query: "party hits" },
];

const CATEGORY_FILTERS = [
  { label: "Artists", icon: "🎤", tint: "#A14BFF30", filter: "artist" as Filter },
  { label: "Albums", icon: "💿", tint: "#FF375F30", filter: "album" as Filter },
  { label: "Playlists", icon: "📻", tint: "#30D15830", filter: "playlist" as Filter },
  { label: "Songs", icon: "🎵", tint: "#0A84FF30", filter: "track" as Filter },
];

export function SearchScreen({ navigation }: TabScreenProps<"Search">) {
  const { playTrack, setActionTrack } = usePlayer();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("monowave-search-history").then((val) => {
      if (val) {
        try {
          setHistory(JSON.parse(val));
        } catch {}
      }
    });
  }, []);

  const saveHistory = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setHistory((prev) => {
      const next = [clean, ...prev.filter((t) => t !== clean)].slice(0, 20);
      void AsyncStorage.setItem("monowave-search-history", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const timer = setTimeout(async () => {
      setPending(true);
      setError("");
      try {
        const res = await searchMusic(term, abort.signal);
        setResults(res);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(`Search failed: ${String(e)}`);
        }
      } finally {
        if (!abort.signal.aborted) setPending(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [query]);

  const find = (term: string) => {
    setQuery(term);
    saveHistory(term);
  };

  const visibleResults = results.filter((r) =>
    filter === "all" ? true : r.kind === filter
  );

  const openCategory = (f: Filter) => {
    setFilter(f);
  };

  const playFrom = (track: Track) => {
    saveHistory(query);
    playTrack(track, [track]);
  };

  const openCollection = (item: SearchItem) => {
    saveHistory(query);
    navigation.navigate("Collection", { item });
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      <ScreenTitle title="Search" detail="Find your next favourite" />
      <SearchBox
        value={query}
        onChangeText={setQuery}
        onSearch={() => find(query)}
        placeholder="What do you want to hear?"
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(["all", "track", "album", "artist", "playlist"] as Filter[]).map(
          (value) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={({ pressed }) => [
                styles.filterPill,
                filter === value && styles.filterPillActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === value && styles.filterTextActive,
                ]}
              >
                {value === "track"
                  ? "Songs"
                  : value === "all"
                    ? "All"
                    : `${value[0].toUpperCase()}${value.slice(1)}${value === "artist" ? "s" : "s"}`}
              </Text>
            </Pressable>
          )
        )}
      </ScrollView>

      {!query.trim() && !results.length ? (
        <>
          <SectionHeader title="Recent searches" />
          <View style={styles.chipGrid}>
            {history.map((term) => (
              <Pressable
                key={term}
                onPress={() => find(term)}
                style={({ pressed }) => [
                  styles.searchChip,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MagnifyingGlass size={18} color={C.text} weight="bold" />
                <Text numberOfLines={1} style={styles.searchChipText}>
                  {term}
                </Text>
              </Pressable>
            ))}
            {!history.length ? (
              <Text style={styles.placeholder}>Your recent searches will appear here.</Text>
            ) : null}
          </View>

          <SectionHeader title="Explore by mood" />
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => (
              <Pressable
                key={mood.label}
                onPress={() => find(mood.query)}
                style={({ pressed }) => [
                  styles.moodCard,
                  { backgroundColor: mood.tint },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.moodIcon}>{mood.icon}</Text>
                <View style={styles.moodFooter}>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                  <CaretRight size={20} color={C.text} weight="bold" />
                </View>
              </Pressable>
            ))}
          </View>

          <SectionHeader title="Browse categories" />
          <View style={styles.categoryGrid}>
            {CATEGORY_FILTERS.map((category) => (
              <Pressable
                key={category.label}
                onPress={() => openCategory(category.filter)}
                style={({ pressed }) => [
                  styles.categoryCard,
                  { backgroundColor: category.tint },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {pending ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={styles.loadingText}>Searching YouTube Music…</Text>
        </View>
      ) : null}
      {!pending && results.length ? (
        <SectionHeader
          title="Results"
          detail={`${visibleResults.length} shown`}
        />
      ) : null}
      {visibleResults.map((item) => (
        <TrackLine
          key={`${item.kind}:${item.id}`}
          track={
            item.track ?? {
              id: item.id,
              title: item.title,
              artist: item.subtitle,
              cover: item.cover,
              }
          }
          onPress={() =>
            item.track ? playFrom(item.track) : openCollection(item)
          }
          onMore={item.track ? () => setActionTrack(item.track) : undefined}
          trailing={
            item.kind === "track" ? undefined : (
              <CaretRight size={20} color={C.muted} />
            )
          }
        />
      ))}
      {!pending && query.trim() && !visibleResults.length ? (
        <Text style={styles.placeholder}>
          No matching results for this filter.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 100 },
  filterRow: { gap: 10, paddingVertical: 12 },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: C.panelStrong,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  filterPillActive: { backgroundColor: C.text, borderColor: C.text },
  filterText: { color: C.text, fontSize: 14, fontWeight: "600" },
  filterTextActive: { color: C.bg, fontWeight: "800" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  searchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.panelStrong,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  searchChipText: { color: C.text, fontSize: 14, fontWeight: "600" },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  moodCard: {
    width: "47%",
    aspectRatio: 1.2,
    borderRadius: 20,
    padding: 16,
    justifyContent: "space-between",
  },
  moodIcon: { fontSize: 32 },
  moodFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moodLabel: { color: C.text, fontSize: 16, fontWeight: "700" },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  categoryCard: {
    width: "47%",
    aspectRatio: 1.8,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIcon: { fontSize: 24 },
  categoryLabel: { color: C.text, fontSize: 15, fontWeight: "700" },
  loadingText: { color: C.faint, marginTop: 16, fontSize: 13 },
  placeholder: {
    color: C.faint,
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
  errorText: { color: C.danger, marginTop: 10, fontSize: 14, textAlign: 'center' },
});


