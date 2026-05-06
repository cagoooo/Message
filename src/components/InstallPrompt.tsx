"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "teachers-ai-install-dismissed-until";
const SNOOZE_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // PWA 已安裝（display-mode: standalone 或 iOS 的 navigator.standalone）
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isSnoozed(): boolean {
  try {
    const until = window.localStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

function snooze() {
  try {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(DISMISS_KEY, String(until));
  } catch {
    // 忽略
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || isSnoozed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // 延遲 5 秒再顯示，避免一進來就被打擾
      window.setTimeout(() => setVisible(true), 5000);
    };

    const installedHandler = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        setDeferred(null);
      } else {
        snooze();
        setVisible(false);
      }
    } catch (err) {
      console.warn("[InstallPrompt] prompt failed", err);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    snooze();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && deferred && (
        <motion.div
          role="dialog"
          aria-label="安裝教師小幫手 App"
          initial={{ opacity: 0, y: 80, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-xl border border-border bg-card text-card-foreground shadow-2xl p-4"
        >
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="關閉提示"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-1">
              <Download className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm">安裝到主畫面</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              把「教師小幫手」加到主畫面，下次打開像 App 一樣快、可離線顯示歷史紀錄。
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleInstall}
                className="flex-1 transform transition-transform hover:scale-105 active:scale-100"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                立即安裝
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDismiss}
              >
                稍後
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
