import { useState, useEffect, useCallback } from "react";
import { PreferencesData, INITIAL_PREFERENCES_DATA } from "../storage/schemas";
import {
  PreferencesRepository,
  defaultPreferencesRepository,
} from "../storage/preferencesRepository";

export function usePreferencesController(
  repo: PreferencesRepository = defaultPreferencesRepository,
) {
  const [preferences, setPreferences] = useState<PreferencesData>(
    INITIAL_PREFERENCES_DATA,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    repo.load().then((loaded) => {
      if (active) {
        setPreferences(loaded);
        setReady(true);
      }
    });

    const unsubscribe = repo.subscribe((updated) => {
      if (active) {
        setPreferences(updated);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [repo]);

  const updatePreferences = useCallback(
    async (updates: Partial<PreferencesData>) => {
      return repo.save(updates);
    },
    [repo],
  );

  return {
    preferences,
    ready,
    updatePreferences,
  };
}

export type PreferencesController = ReturnType<typeof usePreferencesController>;
