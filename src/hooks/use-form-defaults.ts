"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "teachers-ai-defaults-v1";

export interface FormDefaults {
  schoolName?: string;
  teacherName?: string;
  studentGrade?: string;
  // notes 不存（每次回覆情境不同，不該預設）
}

const EMPTY: FormDefaults = {};

function safeParse(raw: string | null): FormDefaults {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const out: FormDefaults = {};
    if (typeof parsed.schoolName === "string") out.schoolName = parsed.schoolName;
    if (typeof parsed.teacherName === "string") out.teacherName = parsed.teacherName;
    if (typeof parsed.studentGrade === "string")
      out.studentGrade = parsed.studentGrade;
    return out;
  } catch {
    return EMPTY;
  }
}

/**
 * 記住老師的個人偏好（學校 / 老師名 / 預設年級），下次打開預填。
 * 純 localStorage，不上雲端。
 */
export function useFormDefaults() {
  const [defaults, setDefaults] = useState<FormDefaults>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDefaults(safeParse(window.localStorage.getItem(STORAGE_KEY)));
    setHydrated(true);
  }, []);

  const save = useCallback((next: FormDefaults) => {
    setDefaults(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("[form-defaults] write failed", err);
    }
  }, []);

  const clear = useCallback(() => save(EMPTY), [save]);

  return { defaults, hydrated, save, clear };
}
