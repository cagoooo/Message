"use client";

import { useEffect, useState } from "react";

/**
 * 假進度條：在 isPending 時從 10 → 95 隨機跳，
 * 完成（hasResult 為 true）時跳 100，再淡出回 0。
 *
 * 不是真實進度（AI 呼叫沒提供進度資訊），
 * 純粹給使用者「事情正在進行」的視覺回饋。
 */
export function useFakeProgress(isPending: boolean, hasResult: boolean): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (isPending && !hasResult) {
      setProgress(10);
      let current = 10;
      timer = setInterval(() => {
        current += Math.floor(Math.random() * 10) + 5;
        if (current >= 95) {
          setProgress(95);
          if (timer) clearInterval(timer);
        } else {
          setProgress(current);
        }
      }, 400);
    } else if (hasResult) {
      setProgress(100);
      const t = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(t);
    } else if (!isPending) {
      setProgress(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPending, hasResult]);

  return progress;
}
