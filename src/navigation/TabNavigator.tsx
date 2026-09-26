import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  House,
  MagnifyingGlass,
  MusicNotes,
  Clock,
} from "phosphor-react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { C } from "../ui/theme";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

function TabBarButton(props: BottomTabBarButtonProps) {
  const { onPress, onLongPress, accessibilityState, children, style } = props;
  const focused = accessibilityState?.selected;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      android_ripple={{
        color: "rgba(180, 107, 255, 0.16)",
        borderless: true,
        radius: 24,
      }}
      style={({ pressed }) => [
        style,
        styles.tabButton,
        {
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.88 : focused ? 1.04 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        {children}
        {focused ? <View style={styles.activeIndicator} /> : null}
      </View>
    </Pressable>
  );
}

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const baseTabHeight = 56;
  const tabHeight = baseTabHeight + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarStyle: {
          backgroundColor: "rgba(10, 10, 15, 0.92)",
          position: "absolute",
          borderTopWidth: 1,
          borderTopColor: C.lineStrong,
          height: tabHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
          elevation: 8,
        },
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.faint,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <House
              size={24}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MagnifyingGlass
              size={24}
              color={color}
              weight={focused ? "bold" : "regular"}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MusicNotes
              size={24}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Clock
              size={24}
              color={color}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 42,
    borderRadius: 21,
  },
  iconWrapActive: {
    backgroundColor: "rgba(180, 107, 255, 0.12)",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.accent,
  },
});
