"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "teachers-ai-history-v1";
const MAX_ENTRIES = 20;

export type HistoryEntry = {
  id: string;
  ts: number;
  scenario: string;
  scenarioLabel: string;
  parentMessage: string;
  reply: string;
};

function safeParse(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        e &&
        typeof e.id === "string" &&
        typeof e.ts === "number" &&
        typeof e.scenario === "string" &&
        typeof e.parentMessage === "string" &&
        typeof e.reply === "string",
    );
  } catch {
    return [];
  }
}

export function useHistory() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setItems(safeParse(window.localStorage.getItem(STORAGE_KEY)));
    setHydrated(true);

    // 跨 tab 同步
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(safeParse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: HistoryEntry[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("[history] localStorage write failed", err);
    }
  }, []);

  const add = useCallback(
    (entry: Omit<HistoryEntry, "id" | "ts">) => {
      const e: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
      };
      setItems((prev) => {
        const next = [e, ...prev].slice(0, MAX_ENTRIES);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (err) {
          console.warn("[history] localStorage write failed", err);
        }
        return next;
      });
    },
    [],
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((x) => x.id !== id);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { items, hydrated, add, remove, clear, max: MAX_ENTRIES };
}
