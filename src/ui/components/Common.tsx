import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import {
  Waveform,
  Gear,
  CaretRight,
  MagnifyingGlass,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../theme";
import { normalizeArtworkUrl } from "../utils";

export function AnimatedWaveform({
  size = 20,
  color = C.accent,
  animating = true,
  barCount = 3,
}: {
  size?: number;
  color?: string;
  animating?: boolean;
  barCount?: number;
}) {
  const bars = useMemo(
    () => Array.from({ length: barCount }, () => new Animated.Value(0.35)),
    [barCount],
  );

  useEffect(() => {
    if (!animating) {
      bars.forEach((b) => b.setValue(0.35));
      return;
    }

    const loops = bars.map((bar, index) => {
      const minScale = 0.25;
      const maxScale = 0.85 + (index % 2 === 0 ? 0.15 : 0.05);
      const duration = 380 + index * 110;

      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: maxScale,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: minScale,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return animation;
    });

    return () => {
      loops.forEach((anim) => anim.stop());
    };
  }, [animating, bars]);

  const barWidth = Math.max(2.5, Math.round(size / (barCount * 2.2)));
  const barGap = Math.max(2, Math.round(size / (barCount * 2.6)));

  return (
    <View
      style={[
        styles.waveformContainer,
        { width: size, height: size, gap: barGap },
      ]}
      accessibilityRole="image"
      accessibilityLabel={
        animating ? "Playing audio waveform" : "Paused audio waveform"
      }
    >
      {bars.map((barAnim, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.waveformBar,
            {
              width: barWidth,
              height: size,
              backgroundColor: color,
              borderRadius: barWidth / 2,
              transform: [{ scaleY: barAnim }],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function Artwork({
  uri,
  size = 52,
  radius = 12,
}: {
  uri?: string;
  size?: number;
  radius?: number;
}) {
  const [errorUri, setErrorUri] = useState<string | null>(null);

  const normalizedUri = useMemo(() => {
    return normalizeArtworkUrl(uri, size);
  }, [uri, size]);

  const hasError = normalizedUri ? errorUri === normalizedUri : false;

  if (normalizedUri && !hasError) {
    return (
      <View
        style={[
          styles.artworkContainer,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <Image
          source={{ uri: normalizedUri }}
          style={{ width: size, height: size, borderRadius: radius }}
          onError={() => setErrorUri(normalizedUri)}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.emptyArt,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text
        style={{
          color: C.accent,
          fontSize: Math.max(14, Math.round(size / 2.8)),
        }}
      >
        ♫
      </Text>
    </View>
  );
}

export function BrandHeader({
  onHome,
  onSettings,
}: {
  onHome: () => void;
  onSettings: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
      <Pressable
        onPress={onHome}
        hitSlop={10}
        style={({ pressed }) => [
          styles.brandWrap,
          { transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Home"
      >
        <Waveform
          size={28}
          color={C.accent}
          weight="bold"
          style={{ transform: [{ rotate: "-8deg" }] }}
        />
        <Text style={styles.brand}>MONOWAVE</Text>
      </Pressable>
      <Pressable
        onPress={onSettings}
        hitSlop={12}
        style={({ pressed }) => [
          styles.iconButton,
          { transform: [{ scale: pressed ? 0.88 : 1 }] },
          pressed && styles.iconButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Settings"
      >
        <Gear size={24} color={C.text} />
      </Pressable>
    </View>
  );
}

export function Action({
  label,
  onPress,
  active = false,
  wide = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  wide?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.action,
        wide && styles.actionWide,
        active && styles.actionActive,
        danger && styles.actionDanger,
        { transform: [{ scale: pressed ? 0.96 : 1 }] },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.actionText,
          active && styles.actionTextActive,
          danger && styles.actionTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionHeader({
  title,
  detail,
  action,
  onAction,
}: {
  title: string;
  detail?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
      </View>
      {action && onAction ? (
        <Pressable
          hitSlop={10}
          onPress={onAction}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
            pressed && { opacity: 0.75 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.sectionAction}>{action}</Text>
            <CaretRight size={14} color={C.accent} weight="bold" />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ScreenTitle({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <View style={styles.screenTitleWrap}>
      <Text style={styles.screenTitle}>{title}</Text>
      {detail ? <Text style={styles.screenSubtitle}>{detail}</Text> : null}
    </View>
  );
}

export function SearchBox({
  value,
  onChangeText,
  onSearch,
  placeholder = "Search...",
  loading = false,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  loading?: boolean;
}) {
  return (
    <View
      style={styles.searchBox}
      accessibilityRole="search"
      accessibilityState={{ busy: loading }}
    >
      <MagnifyingGlass size={20} color={C.muted} weight="bold" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        style={styles.searchInput}
        accessibilityLabel={placeholder}
      />
      {loading ? (
        <ActivityIndicator
          size="small"
          color={C.accent}
          style={styles.searchSpinner}
          accessibilityLabel="Searching"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  artworkContainer: {
    backgroundColor: C.panelStrong,
    overflow: "hidden",
  },
  emptyArt: {
    backgroundColor: C.panelStrong,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  topBar: {
    minHeight: 64,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.bg,
  },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: {
    color: C.accent,
    fontWeight: "900",
    letterSpacing: 1.6,
    fontSize: 16,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF08",
    borderWidth: 1,
    borderColor: C.line,
  },
  iconButtonPressed: {
    backgroundColor: "#FFFFFF18",
    borderColor: C.accent,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  waveformBar: {
    backgroundColor: C.accent,
  },
  action: {
    alignSelf: "flex-start",
    minHeight: 46,
    justifyContent: "center",
    backgroundColor: C.panel,
    borderColor: C.line,
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 15,
    marginBottom: 8,
  },
  actionWide: { alignSelf: "stretch", alignItems: "center" },
  actionActive: { backgroundColor: C.accent, borderColor: C.accent },
  actionDanger: { backgroundColor: "#3A1723", borderColor: "#FF7A9B44" },
  actionText: { color: C.text, fontSize: 13.5, fontWeight: "800" },
  actionTextActive: { color: C.bg },
  actionTextDanger: { color: C.danger },
  pressed: { opacity: 0.72 },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  sectionDetail: { color: C.muted, fontSize: 13.5, marginTop: 3 },
  sectionAction: {
    color: C.accent,
    fontSize: 13.5,
    fontWeight: "800",
    paddingBottom: 2,
  },
  screenTitleWrap: { marginTop: 2, marginBottom: 18 },
  screenTitle: {
    color: C.text,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "900",
    letterSpacing: -1,
  },
  screenSubtitle: { color: C.muted, fontSize: 15, marginTop: 5 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.panelStrong,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: C.lineStrong,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 12, color: C.text, fontSize: 16 },
  searchSpinner: { marginLeft: 8 },
});
