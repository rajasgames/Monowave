import React from "react";

export const useSafeAreaInsets = () => ({
  top: 32,
  bottom: 24,
  left: 0,
  right: 0,
});

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) =>
  children;
export const SafeAreaView = ({ children }: { children: React.ReactNode }) =>
  children;
