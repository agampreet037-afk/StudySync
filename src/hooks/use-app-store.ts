import { useMemo, useSyncExternalStore } from "react";

import { getServerState, getState, subscribe } from "@/lib/storage";
import type { AppState, Subject } from "@/types";

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

export function useSubjectsMap(): Map<string, Subject> {
  const { subjects } = useAppState();
  return useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
}
