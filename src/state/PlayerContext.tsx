import React, { createContext, useContext, useState } from "react";
import { useMonowave } from "../useMonowave";
import { useRecommendations } from "../useRecommendations";

type MonowaveState = ReturnType<typeof useMonowave> & {
  actionTrack: any;
  setActionTrack: (track: any) => void;
};
type RecoState = ReturnType<typeof useRecommendations>;

export const PlayerContext = createContext<MonowaveState | null>(null);
export const RecoContext = createContext<RecoState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("Missing PlayerContext");
  return ctx;
}

export function useRecos() {
  const ctx = useContext(RecoContext);
  if (!ctx) throw new Error("Missing RecoContext");
  return ctx;
}

export function StateProvider({ children }: { children: React.ReactNode }) {
  const monowave = useMonowave();
  const recos = useRecommendations(monowave);
  const [actionTrack, setActionTrack] = useState<any>(null);

  return (
    <PlayerContext.Provider
      value={{ ...monowave, actionTrack, setActionTrack }}
    >
      <RecoContext.Provider value={recos}>{children}</RecoContext.Provider>
    </PlayerContext.Provider>
  );
}
