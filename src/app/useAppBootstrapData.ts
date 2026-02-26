import { useCallback, useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import * as api from "../api";
import type { DecisionInboxItem } from "../components/chat/decision-inbox";
import { detectBrowserLanguage } from "../i18n";
import type { Agent, CompanySettings, CompanyStats, Department, MeetingPresence, SubTask, Task } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { ROOM_THEMES_STORAGE_KEY } from "./constants";
import { mapWorkflowDecisionItemsRaw } from "./decision-inbox";
import type { RoomThemeMap } from "./types";
import {
  isRoomThemeMap,
  isUserLanguagePinned,
  mergeSettingsWithDefaults,
  readStoredClientLanguage,
  syncClientLanguage,
} from "./utils";

type StoredRoomThemes = {
  themes: RoomThemeMap;
  hasStored: boolean;
};

type UseAppBootstrapDataParams = {
  initialRoomThemes: StoredRoomThemes;
  hasLocalRoomThemesRef: MutableRefObject<boolean>;
  setDepartments: Dispatch<SetStateAction<Department[]>>;
  setAgents: Dispatch<SetStateAction<Agent[]>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setStats: Dispatch<SetStateAction<CompanyStats | null>>;
  setSettings: Dispatch<SetStateAction<CompanySettings>>;
  setSubtasks: Dispatch<SetStateAction<SubTask[]>>;
  setMeetingPresence: Dispatch<SetStateAction<MeetingPresence[]>>;
  setDecisionInboxItems: Dispatch<SetStateAction<DecisionInboxItem[]>>;
  setCustomRoomThemes: Dispatch<SetStateAction<RoomThemeMap>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
};

export function useAppBootstrapData({
  initialRoomThemes,
  hasLocalRoomThemesRef,
  setDepartments,
  setAgents,
  setTasks,
  setStats,
  setSettings,
  setSubtasks,
  setMeetingPresence,
  setDecisionInboxItems,
  setCustomRoomThemes,
  setLoading,
}: UseAppBootstrapDataParams): void {
  const fetchAll = useCallback(async () => {
    try {
      const [depts, ags, tks, sts, sett, subs, presence, decisionItems] = await Promise.all([
        api.getDepartments(),
        api.getAgents(),
        api.getTasks(),
        api.getStats(),
        api.getSettings(),
        api.getActiveSubtasks(),
        api.getMeetingPresence().catch(() => []),
        api.getDecisionInbox().catch(() => []),
      ]);
      setDepartments(depts);
      setAgents(ags);
      setTasks(tks);
      setStats(sts);
      const mergedSettings = mergeSettingsWithDefaults(sett);
      const autoDetectedLanguage = detectBrowserLanguage();
      const storedClientLanguage = readStoredClientLanguage();
      const shouldAutoAssignLanguage =
        !isUserLanguagePinned() && !storedClientLanguage && mergedSettings.language === DEFAULT_SETTINGS.language;
      const nextSettings = shouldAutoAssignLanguage
        ? { ...mergedSettings, language: autoDetectedLanguage }
        : mergedSettings;

      setSettings(nextSettings);
      syncClientLanguage(nextSettings.language);
      const dbRoomThemes = isRoomThemeMap(nextSettings.roomThemes) ? nextSettings.roomThemes : undefined;

      if (!hasLocalRoomThemesRef.current && dbRoomThemes && Object.keys(dbRoomThemes).length > 0) {
        setCustomRoomThemes(dbRoomThemes);
        hasLocalRoomThemesRef.current = true;
        try {
          window.localStorage.setItem(ROOM_THEMES_STORAGE_KEY, JSON.stringify(dbRoomThemes));
        } catch {
          // ignore quota errors
        }
      }

      if (
        hasLocalRoomThemesRef.current &&
        Object.keys(initialRoomThemes.themes).length > 0 &&
        (!dbRoomThemes || Object.keys(dbRoomThemes).length === 0)
      ) {
        api.saveRoomThemes(initialRoomThemes.themes).catch((error) => {
          console.error("Room theme sync to DB failed:", error);
        });
      }

      if (shouldAutoAssignLanguage && mergedSettings.language !== autoDetectedLanguage) {
        api.saveSettings(nextSettings).catch((error) => {
          console.error("Auto language sync failed:", error);
        });
      }
      setSubtasks(subs);
      setMeetingPresence(presence);
      setDecisionInboxItems(mapWorkflowDecisionItemsRaw(decisionItems ?? []));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    hasLocalRoomThemesRef,
    initialRoomThemes.themes,
    setAgents,
    setCustomRoomThemes,
    setDecisionInboxItems,
    setDepartments,
    setLoading,
    setMeetingPresence,
    setSettings,
    setStats,
    setSubtasks,
    setTasks,
  ]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);
}
