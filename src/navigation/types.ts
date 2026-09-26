import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { SearchItem } from "../music";

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  History: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Player: undefined;
  Settings: undefined;
  Collection: { item: SearchItem };
  Playlist: { id: string };
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  RootScreenProps<keyof RootStackParamList>
>;
