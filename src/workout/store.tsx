// Workouts live inside the single app document (NutritionDoc.workouts), so one
// upload, export and Drive sync cover diet and training alike. This hook is a
// thin adapter over the main store — no separate persistence.

import { useStore } from '../store';
import type { WorkoutEntry } from './types';

const byDateDesc = (a: WorkoutEntry, b: WorkoutEntry) => b.date.localeCompare(a.date);

export interface WorkoutStore {
  entries: WorkoutEntry[];
  ready: boolean;
  addEntry: (e: Omit<WorkoutEntry, 'id'>) => void;
  updateEntry: (id: string, patch: Omit<WorkoutEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  /** Replace the whole list (import). */
  replaceAll: (entries: WorkoutEntry[]) => void;
  /** Append imported entries, skipping ids that already exist. Returns how many were added. */
  mergeAll: (entries: WorkoutEntry[]) => number;
  clearAll: () => void;
}

export function useWorkouts(): WorkoutStore {
  const { doc, ready, setWorkouts } = useStore();
  const entries = doc.workouts ?? [];

  return {
    entries,
    ready,
    addEntry: (e) => setWorkouts([{ ...e, id: crypto.randomUUID() }, ...entries]),
    updateEntry: (id, patch) => setWorkouts(entries.map((x) => (x.id === id ? { ...patch, id } : x))),
    removeEntry: (id) => setWorkouts(entries.filter((x) => x.id !== id)),
    replaceAll: (next) => setWorkouts([...next].sort(byDateDesc)),
    mergeAll: (incoming) => {
      const seen = new Set(entries.map((e) => e.id));
      const fresh = incoming.filter((e) => !seen.has(e.id));
      if (fresh.length) setWorkouts([...entries, ...fresh].sort(byDateDesc));
      return fresh.length;
    },
    clearAll: () => setWorkouts([]),
  };
}
