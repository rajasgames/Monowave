import React from "react";
import { View, Text, Pressable, Image, StyleSheet, TextInput } from "react-native";
import { Waveform, Gear, CaretRight, MagnifyingGlass } from "phosphor-react-native";
import { C } from "../theme";

export function Artwork({
  uri,
  size = 52,
  radius = 12,
}: {
  uri?: string;
  size?: number;
  radius?: number;
}) {
  if (uri)
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  return (
    <View
      style={[
        styles.emptyArt,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={{ color: C.accent, fontSize: size / 3 }}>♫</Text>
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
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onHome} hitSlop={10} style={styles.brandWrap} accessibilityRole="button" accessibilityLabel="Home">
        <Waveform
          size={28}
          color={C.accent}
          weight="bold"
          style={{ transform: [{ rotate: "-8deg" }] }}
        />
        <Text style={styles.brand}>MONOWAVE</Text>
      </Pressable>
      <Pressable onPress={onSettings} hitSlop={12} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Settings">
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
        <Pressable hitSlop={10} onPress={onAction} accessibilityRole="button" accessibilityLabel={action}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.sectionAction}>{action}</Text>
            <CaretRight size={14} color={C.accent} weight="bold" />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ScreenTitle({ title, detail }: { title: string; detail?: string }) {
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
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSearch?: () => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.searchBox}>
      <MagnifyingGlass size={20} color={C.muted} weight="bold" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        style={styles.searchInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyArt: {
    backgroundColor: C.panelStrong,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  topBar: {
    height: 64,
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
});
