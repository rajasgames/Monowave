import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Linking,
  Pressable,
  Switch,
  Alert,
  StyleSheet,
} from "react-native";
import {
  Play,
  ArrowCounterClockwise,
  Trash,
  ShieldCheck,
  Code,
  GithubLogo,
  Info,
  Clock,
  Sparkle,
  HardDrive,
} from "phosphor-react-native";
import { usePlayer, usePreferences, useRecos } from "../state/PlayerContext";
import { defaultSearchHistoryRepository } from "../storage/searchHistoryRepository";
import { ScreenTitle, SectionHeader, Action } from "../ui/components";
import { C } from "../ui/theme";
import type { RootScreenProps } from "../navigation/types";
import { useScreenContentPadding } from "../ui/utils";

const SEEK_OPTIONS = [5, 10, 15, 30];

export function SettingsScreen({ navigation }: RootScreenProps<"Settings">) {
  const { data, setName, clearHistory } = usePlayer();
  const { preferences, updatePreferences } = usePreferences();
  const { refresh: refreshRecos } = useRecos();
  const contentPadding = useScreenContentPadding({ isModal: true });

  const [message, setMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleClearSearchHistory = () => {
    Alert.alert(
      "Clear Search History",
      "Are you sure you want to clear your recent searches?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await defaultSearchHistoryRepository.clear();
            showToast("Search history cleared");
          },
        },
      ],
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear Playback History",
      "Are you sure you want to clear all listening history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearHistory();
            showToast("Playback history cleared");
          },
        },
      ],
    );
  };

  const handleResetRecommendations = () => {
    Alert.alert(
      "Reset Discover Mix",
      "This will clear the cached Discover Mix and recompute it from your listening profile.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset & Refresh",
          onPress: () => {
            refreshRecos();
            showToast("Discover Mix refreshed");
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, contentPadding]}
    >
      <ScreenTitle title="Settings" detail="Preferences & Storage" />

      {message ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{message}</Text>
        </View>
      ) : null}

      {/* Profile Section */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>PROFILE</Text>
        <Text style={styles.cardLabel}>DISPLAY NAME</Text>
        <TextInput
          value={data.name}
          onChangeText={setName}
          placeholder="Optional name"
          placeholderTextColor={C.faint}
          style={styles.input}
          maxLength={40}
        />
        <Text style={styles.cardHelper}>
          Stored only on this device for a personalized greeting.
        </Text>
      </View>

      {/* Playback Section */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>PLAYBACK</Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Autoplay next track</Text>
            <Text style={styles.settingSubtitle}>
              Automatically advance to the next queued song when current track
              ends.
            </Text>
          </View>
          <Switch
            value={preferences.autoplay}
            onValueChange={(val) => void updatePreferences({ autoplay: val })}
            trackColor={{ false: C.lineStrong, true: C.accent }}
            thumbColor={C.text}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Seek Interval</Text>
            <Text style={styles.settingSubtitle}>
              Seconds to skip forward or backward.
            </Text>
          </View>
          <View style={styles.seekSelector}>
            {SEEK_OPTIONS.map((seconds) => (
              <Pressable
                key={seconds}
                onPress={() =>
                  void updatePreferences({ seekIntervalSeconds: seconds })
                }
                style={[
                  styles.seekPill,
                  preferences.seekIntervalSeconds === seconds &&
                    styles.seekPillActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${seconds} seconds seek interval`}
              >
                <Text
                  style={[
                    styles.seekPillText,
                    preferences.seekIntervalSeconds === seconds &&
                      styles.seekPillTextActive,
                  ]}
                >
                  {seconds}s
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Recommendations Section */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>RECOMMENDATIONS</Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Enable Discover Mix</Text>
            <Text style={styles.settingSubtitle}>
              Generate on-device music mixes from your listening history.
            </Text>
          </View>
          <Switch
            value={preferences.enableDiscoverMix}
            onValueChange={(val) =>
              void updatePreferences({ enableDiscoverMix: val })
            }
            trackColor={{ false: C.lineStrong, true: C.accent }}
            thumbColor={C.text}
          />
        </View>

        <View style={styles.divider} />

        <Action
          label="Refresh Discover Mix Profile"
          wide
          onPress={handleResetRecommendations}
        />
      </View>

      {/* Storage and Data Section */}
      <View style={styles.card}>
        <Text style={styles.sectionKicker}>DATA & LOCAL STORAGE</Text>

        <View style={styles.actionStack}>
          <Action
            label="Clear Search History"
            wide
            onPress={handleClearSearchHistory}
          />
          <Action
            label="Clear Listening History"
            wide
            danger
            onPress={handleClearHistory}
          />
        </View>
      </View>

      {/* About Section */}
      <SectionHeader title="About Monowave" />
      <View style={styles.card}>
        <View style={styles.aboutHeader}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 22, color: C.accent, fontWeight: "900" }}>
              M
            </Text>
          </View>
          <View>
            <Text style={styles.aboutAppName}>Monowave</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0 (Build 1)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Monowave is an open-source, local-first music player for Android. All
          your listening history, playlists, likes, and recommendation profiles
          are computed and kept exclusively on your device.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Direct streaming is powered by the NewPipe Extractor native module.
          Monowave has no analytics, no accounts, and no intermediary servers.
        </Text>
      </View>

      <View style={styles.linkStack}>
        <Action
          label="GitHub Repository  ↗"
          wide
          onPress={() =>
            void Linking.openURL("https://github.com/rajasgames/Monowave")
          }
        />
        <Action
          label="NewPipe Extractor Source  ↗"
          wide
          onPress={() =>
            void Linking.openURL(
              "https://github.com/TeamNewPipe/NewPipeExtractor",
            )
          }
        />
        <Action
          label="GNU GPL v3 License  ↗"
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
  toast: {
    backgroundColor: C.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  toastText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  card: {
    padding: 20,
    backgroundColor: C.panelStrong,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.lineStrong,
    marginBottom: 16,
  },
  sectionKicker: {
    color: C.accent,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "800",
    marginBottom: 14,
  },
  cardLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardHelper: {
    color: C.faint,
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: C.bg,
    color: C.text,
    fontSize: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  settingTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  settingSubtitle: {
    color: C.muted,
    fontSize: 12.5,
    marginTop: 3,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: C.lineStrong,
    marginVertical: 14,
  },
  seekSelector: {
    flexDirection: "row",
    gap: 6,
  },
  seekPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  seekPillActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  seekPillText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  seekPillTextActive: {
    color: "#FFFFFF",
  },
  actionStack: {
    gap: 10,
  },
  aboutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#A14BFF20",
    borderWidth: 1,
    borderColor: "#A14BFF40",
    alignItems: "center",
    justifyContent: "center",
  },
  aboutAppName: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
  },
  aboutVersion: {
    color: C.muted,
    fontSize: 12.5,
    marginTop: 2,
  },
  body: { color: C.muted, fontSize: 13.5, lineHeight: 20 },
  linkStack: { marginTop: 8, marginBottom: 24, gap: 10 },
});
