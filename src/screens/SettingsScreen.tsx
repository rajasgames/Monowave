import React from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Linking,
  StyleSheet,
} from "react-native";
import { usePlayer } from "../state/PlayerContext";
import { ScreenTitle, SectionHeader, Action } from "../ui/components";
import { C } from "../ui/theme";
import type { RootScreenProps } from "../navigation/types";
import { useScreenContentPadding } from "../ui/utils";

export function SettingsScreen({ navigation }: RootScreenProps<"Settings">) {
  const { data, setName } = usePlayer();
  const contentPadding = useScreenContentPadding({ isModal: true });

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, contentPadding]}
    >
      <ScreenTitle title="Settings" detail="Personalize Monowave" />
      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>DISPLAY NAME</Text>
        <TextInput
          value={data.name}
          onChangeText={setName}
          placeholder="Optional name"
          placeholderTextColor={C.faint}
          style={styles.settingsInput}
          maxLength={40}
        />
      </View>
      <SectionHeader title="About Monowave" />
      <View style={styles.aboutCard}>
        <Text style={styles.body}>
          Monowave stores likes, playlists, queue, and history locally. It uses
          the Android NewPipe Extractor module to obtain playable streams for
          videos you select. Streaming needs internet access. The app does not
          save audio files.
        </Text>
        <View style={styles.aboutDivider} />
        <Text style={styles.body}>
          Recommendations are built on this device from finished listens,
          repeated plays, likes, playlist saves, searches, and skips. Candidate
          tracks come from YouTube Music related queues, artist pages, and
          searches.
        </Text>
        <View style={styles.aboutDivider} />
        <Text style={styles.body}>
          Search uses YouTube Music's unofficial web interface. Playback
          availability can change when that service changes, or when a track is
          restricted.
        </Text>
      </View>
      <View style={styles.linkStack}>
        <Action
          label="NewPipe Extractor source  ↗"
          wide
          onPress={() =>
            void Linking.openURL(
              "https://github.com/TeamNewPipe/NewPipeExtractor",
            )
          }
        />
        <Action
          label="NØTE reference project  ↗"
          wide
          onPress={() =>
            void Linking.openURL("https://github.com/SJbuilds04/NOTE")
          }
        />
        <Action
          label="GPL-3.0 license  ↗"
          wide
          onPress={() =>
            void Linking.openURL("https://www.gnu.org/licenses/gpl-3.0.html")
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22 },
  settingsCard: {
    padding: 20,
    backgroundColor: C.panelStrong,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.lineStrong,
    marginTop: 10,
    marginBottom: 20,
  },
  settingsLabel: {
    color: C.accent,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "800",
    marginBottom: 12,
  },
  settingsInput: {
    backgroundColor: C.bg,
    color: C.text,
    fontSize: 18,
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  aboutCard: {
    padding: 24,
    backgroundColor: C.panelStrong,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.lineStrong,
    marginTop: 4,
  },
  body: { color: C.muted, fontSize: 14, lineHeight: 22 },
  aboutDivider: {
    height: 1,
    backgroundColor: C.lineStrong,
    marginVertical: 18,
  },
  linkStack: { marginTop: 24, gap: 12 },
});
