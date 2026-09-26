import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { CaretLeft } from "phosphor-react-native";
import { usePlayer } from "../state/PlayerContext";
import { Artwork, Action, TrackRow as TrackLine } from "../ui/components";
import { C } from "../ui/theme";
import type { RootScreenProps } from "../navigation/types";
import { browseMusic } from "../music";
import type { SearchItem } from "../music";
import { useScreenContentPadding } from "../ui/utils";

export function CollectionScreen({
  route,
  navigation,
}: RootScreenProps<"Collection">) {
  const { playTrack, setActionTrack } = usePlayer();
  const { item } = route.params;
  const contentPadding = useScreenContentPadding({ isModal: true });

  const [children, setChildren] = useState<SearchItem[]>([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    browseMusic(item.id)
      .then((res) => {
        if (mounted) {
          setChildren(res);
          setPending(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(`Could not open ${item.title}: ${String(e)}`);
          setPending(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [item.id, item.title]);

  const tracksInCollection = children.flatMap((c) =>
    c.track ? [c.track] : [],
  );
  const collectionKind =
    item.kind === "artist"
      ? "artist"
      : item.kind === "album"
        ? "album"
        : "playlist";

  return (
    <FlatList
      data={children}
      keyExtractor={(child) => `${child.kind}:${child.id}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, contentPadding]}
      ListHeaderComponent={
        <>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <CaretLeft size={18} color={C.accent} weight="bold" />
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </Pressable>

          <View style={styles.collectionHero}>
            <Artwork uri={item.cover} size={132} radius={24} />
            <View style={styles.collectionCopy}>
              <Text style={styles.kicker}>{collectionKind.toUpperCase()}</Text>
              <Text numberOfLines={3} style={styles.collectionTitle}>
                {item.title}
              </Text>
              <Text numberOfLines={2} style={styles.collectionSubtitle}>
                {item.subtitle}
              </Text>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!!tracksInCollection.length ? (
            <Action
              label="Play all"
              active
              wide
              onPress={() =>
                playTrack(tracksInCollection[0], tracksInCollection)
              }
            />
          ) : null}

          {pending ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator color={C.accent} size="large" />
              <Text style={styles.loadingText}>Loading collection…</Text>
            </View>
          ) : null}
        </>
      }
      renderItem={({ item: child }) => (
        <TrackLine
          track={
            child.track ?? {
              id: child.id,
              title: child.title,
              artist: child.subtitle,
              cover: child.cover,
            }
          }
          onPress={() =>
            child.track
              ? playTrack(child.track, tracksInCollection)
              : navigation.push("Collection", { item: child })
          }
          onMore={child.track ? () => setActionTrack(child.track!) : undefined}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22 },
  backButton: { marginBottom: 16 },
  backButtonText: {
    color: C.accent,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 4,
  },
  collectionHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 24,
  },
  collectionCopy: { flex: 1, justifyContent: "center" },
  collectionTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  collectionSubtitle: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  kicker: {
    color: C.accent,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "800",
  },
  loadingText: { color: C.faint, marginTop: 16, fontSize: 13 },
  errorText: {
    color: C.danger,
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
});
