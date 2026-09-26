import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
} from "react-native";
import { Heart, MusicNotes, Plus, CaretRight } from "phosphor-react-native";
import { usePlayer } from "../state/PlayerContext";
import { ScreenTitle, SectionHeader, Action, TrackRow as TrackLine } from "../ui/components";
import { C } from "../ui/theme";
import type { TabScreenProps } from "../navigation/types";
import { parseLink, trackById, browseMusic } from "../music";

export function LibraryScreen({ navigation }: TabScreenProps<"Library">) {
  const { data, createPlaylist, playTrack, setActionTrack } = usePlayer();
  const [newList, setNewList] = useState("");
  const [importText, setImportText] = useState("");
  const [pending, setPending] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [error, setError] = useState("");
  const abortRef = React.useRef<AbortController | null>(null);

  const importLink = async () => {
    if (pending) {
      // Allow cancellation
      if (abortRef.current) abortRef.current.abort();
      setPending(false);
      setImportProgress("");
      return;
    }
    const link = parseLink(importText);
    if (!link) {
      setError("Paste a YouTube Music track or playlist link.");
      return;
    }
    setPending(true);
    setImportProgress("Fetching...");
    setError("");
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      if (link.kind === "track") {
        playTrack(await trackById(link.id));
      } else {
        const items = await browseMusic(link.id);
        if (abort.signal.aborted) return;
        
        const rawTracks = items.flatMap((item) => (item.track ? [item.track] : []));
        if (!rawTracks.length) throw new Error("No tracks found in this playlist");

        setImportProgress(`Deduplicating ${rawTracks.length} tracks...`);
        // Yield to UI
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (abort.signal.aborted) return;

        const seen = new Set<string>();
        const uniqueTracks = rawTracks.filter((t) => {
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });

        createPlaylist(`Imported · ${link.id}`, uniqueTracks);
        
        if (uniqueTracks.length < rawTracks.length) {
          setError(`Imported ${uniqueTracks.length} tracks (${rawTracks.length - uniqueTracks.length} duplicates removed)`);
        }
      }
      setImportText("");
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(`Import failed: ${String(e)}`);
      }
    } finally {
      if (!abort.signal.aborted) {
        setPending(false);
        setImportProgress("");
      }
    }
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      <ScreenTitle title="Your library" detail="Everything you save, in one place" />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <View style={styles.statRow}>
        <Pressable onPress={() => {}} style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#5D2C7D" }]}>
            <Heart size={20} color={C.text} weight="fill" />
          </View>
          <View>
            <Text style={styles.statNumber}>{data.liked.length}</Text>
            <Text style={styles.statLabel}>Liked songs</Text>
          </View>
          <CaretRight size={20} color={C.muted} weight="bold" />
        </Pressable>
        <Pressable onPress={() => {}} style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#34365F" }]}>
            <MusicNotes size={20} color={C.text} weight="fill" />
          </View>
          <View>
            <Text style={styles.statNumber}>{data.playlists.length}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
          <CaretRight size={20} color={C.muted} weight="bold" />
        </Pressable>
      </View>

      <SectionHeader
        title="Liked songs"
        detail={`${data.liked.length} song${data.liked.length === 1 ? "" : "s"}`}
      />
      {data.liked.slice(0, 5).map((track) => (
        <TrackLine
          key={track.id}
          track={track}
          onPress={() => playTrack(track, data.liked)}
          onMore={() => setActionTrack(track)}
        />
      ))}
      {!data.liked.length ? (
        <Text style={styles.placeholder}>Songs you like will appear here.</Text>
      ) : null}

      <SectionHeader
        title="Playlists"
        detail={`${data.playlists.length} playlist${data.playlists.length === 1 ? "" : "s"}`}
      />
      <View style={styles.createPlaylistCard}>
        <View style={styles.createIcon}>
          <Plus size={24} color={C.accent} weight="bold" />
        </View>
        <TextInput
          value={newList}
          onChangeText={setNewList}
          placeholder="Create new playlist"
          placeholderTextColor={C.muted}
          style={styles.createPlaylistInput}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (newList.trim()) {
              createPlaylist(newList);
              setNewList("");
            }
          }}
        />
        <Pressable
          onPress={() => {
            if (newList.trim()) {
              createPlaylist(newList);
              setNewList("");
            }
          }}
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </Pressable>
      </View>

      {data.playlists.map((list) => (
        <Pressable
          key={list.id}
          style={({ pressed }) => [styles.playlistCard, pressed && { opacity: 0.7 }]}
          onPress={() => {
            navigation.navigate("Playlist", { id: list.id });
          }}
        >
          <View style={styles.playlistArt}>
            <MusicNotes size={28} color={C.accent} weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.playlistTitle}>{list.name}</Text>
            <Text style={styles.playlistMeta}>{list.tracks.length} tracks</Text>
          </View>
          <CaretRight size={24} color={C.muted} weight="bold" />
        </Pressable>
      ))}

      <SectionHeader
        title="Import a public playlist"
        detail="Bring a playlist from YouTube Music"
      />
      <View style={styles.importCard}>
        <View style={styles.importInputWrap}>
          <Plus size={20} color={C.muted} weight="bold" />
          <TextInput
            value={importText}
            onChangeText={setImportText}
            autoCapitalize="none"
            placeholder="Paste a YouTube Music link"
            placeholderTextColor={C.faint}
            style={styles.importInput}
          />
        </View>
        <Action
          label={pending ? (importProgress || "Cancel") : "Import"}
          active
          onPress={() => void importLink()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 100 },
  statRow: { flexDirection: "row", gap: 12, marginTop: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.panelStrong,
    padding: 16,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: { color: C.text, fontSize: 18, fontWeight: "800" },
  statLabel: { color: C.muted, fontSize: 13, marginTop: 2 },
  createPlaylistCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: C.panelStrong,
    borderRadius: 20,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1C75FF25",
    alignItems: "center",
    justifyContent: "center",
  },
  createPlaylistInput: {
    flex: 1,
    color: C.text,
    fontSize: 16,
    fontWeight: "500",
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.accent,
    borderRadius: 16,
  },
  createButtonText: { color: C.bg, fontWeight: "700", fontSize: 14 },
  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 16,
  },
  playlistArt: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.panelStrong,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  playlistTitle: { color: C.text, fontSize: 16, fontWeight: "700" },
  playlistMeta: { color: C.muted, fontSize: 14, marginTop: 4 },
  importCard: {
    padding: 20,
    backgroundColor: C.panelStrong,
    borderRadius: 24,
    gap: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  importInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    gap: 10,
  },
  importInput: { flex: 1, color: C.text, fontSize: 15 },
  placeholder: { color: C.faint, textAlign: "center", marginTop: 24, fontSize: 14 },
  errorText: { color: C.danger, marginTop: 10, fontSize: 14, textAlign: 'center' },
});

