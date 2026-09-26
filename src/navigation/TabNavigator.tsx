import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { House, MagnifyingGlass, MusicNotes, Clock } from "phosphor-react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { C } from "../ui/theme";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(10, 10, 15, 0.85)",
          position: "absolute",
          borderTopWidth: 1,
          borderTopColor: C.lineStrong,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
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
            <House size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MagnifyingGlass size={24} color={color} weight={focused ? "bold" : "regular"} />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MusicNotes size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Clock size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
