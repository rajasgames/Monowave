import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { NowPlayingScreen } from "../screens/NowPlayingScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { CollectionScreen } from "../screens/CollectionScreen";
import { PlaylistScreen } from "../screens/PlaylistScreen";
import type { RootStackParamList } from "./types";
import { C } from "../ui/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="Player"
        component={NowPlayingScreen}
        options={{ presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="Collection" component={CollectionScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
    </Stack.Navigator>
  );
}
