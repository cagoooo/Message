"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

const isProd = process.env.NODE_ENV === "production";
const BASE = isProd ? "/Message" : "";
const SW_URL = `${BASE}/sw.js`;
const SW_SCOPE = `${BASE}/`;
const VERSION_URL = `${BASE}/version.json`;

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 每 5 分鐘檢查一次

async function clearAllCachesAndReload() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    }
  } catch (err) {
    console.warn("[SW] cache clear failed", err);
  } finally {
    window.location.reload();
  }
}

export function ServiceWorkerRegister() {
  const { toast } = useToast();
  const initialVersionRef = useRef<string | null>(null);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 開發模式不啟用 SW，避免影響 dev 熱重載
    if (!isProd) return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    // 註冊 SW
    navigator.serviceWorker
      .register(SW_URL, { scope: SW_SCOPE })
      .then((reg) => {
        // 偵測 SW 自身有更新
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            // 新 SW 已安裝且舊 SW 仍在控制 → 提示有更新
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller &&
              !promptedRef.current
            ) {
              promptedRef.current = true;
              showUpdateToast();
            }
          });
        });
      })
      .catch((err) => console.warn("[SW] register failed", err));

    // 抓初始版本
    fetch(VERSION_URL, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { version?: string }) => {
        if (cancelled) return;
        if (d?.version) initialVersionRef.current = d.version;
      })
      .catch(() => {});

    // 輪詢版本
    const checkVersion = async () => {
      try {
        const r = await fetch(VERSION_URL, { cache: "no-store" });
        const d = (await r.json()) as { version?: string };
        const initial = initialVersionRef.current;
        if (
          initial &&
          d.version &&
          d.version !== initial &&
          !promptedRef.current
        ) {
          promptedRef.current = true;
          showUpdateToast();
        }
      } catch {
        // 離線或暫時失敗，忽略
      }
    };

    function showUpdateToast() {
      toast({
        title: "🎉 有新版本可用",
        description: "點下方「立即更新」載入最新功能",
        duration: 1000 * 60 * 30, // 30 分鐘 不會自動消失
        action: (
          <ToastAction altText="立即更新" onClick={clearAllCachesAndReload}>
            立即更新
          </ToastAction>
        ),
      });
    }

    const intervalId = window.setInterval(checkVersion, CHECK_INTERVAL_MS);

    // 切回前景時也檢查一次
    const onVisibility = () => {
      if (document.visibilityState === "visible") void checkVersion();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [toast]);

  return null;
}
