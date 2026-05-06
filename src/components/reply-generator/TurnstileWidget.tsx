"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";

type TurnstileTheme = "auto" | "light" | "dark";

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  "timeout-callback"?: () => void;
  theme?: TurnstileTheme;
  size?: "normal" | "compact" | "flexible";
  language?: string;
  appearance?: "always" | "execute" | "interaction-only";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: TurnstileRenderOptions,
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

function ensureScriptLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("not in browser"));
    if (window.turnstile) return resolve();

    const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("script failed")), {
        once: true,
      });
      return;
    }

    const s = document.createElement("script");
    s.id = TURNSTILE_SCRIPT_ID;
    s.src = TURNSTILE_SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script failed"));
    document.head.appendChild(s);
  });
}

export interface TurnstileWidgetHandle {
  reset: () => void;
  getToken: () => string | undefined;
}

export interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err?: unknown) => void;
  theme?: TurnstileTheme;
  size?: "normal" | "compact" | "flexible";
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, onVerify, onExpire, onError, theme = "auto", size = "flexible" }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        },
        getToken: () => {
          if (widgetIdRef.current && window.turnstile) {
            return window.turnstile.getResponse(widgetIdRef.current);
          }
          return undefined;
        },
      }),
      [],
    );

    useEffect(() => {
      let cancelled = false;
      ensureScriptLoaded()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return;
          // 避免 React StrictMode 雙重 render 時重複建 widget
          if (widgetIdRef.current) return;
          try {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
              sitekey: siteKey,
              theme,
              size,
              callback: (token) => onVerify(token),
              "expired-callback": () => {
                onVerify("");
                onExpire?.();
              },
              "error-callback": () => {
                onVerify("");
                onError?.();
              },
            });
          } catch (err) {
            console.error("[Turnstile] render failed:", err);
            onError?.(err);
          }
        })
        .catch((err) => {
          console.warn("[Turnstile] script load failed:", err);
          onError?.(err);
        });

      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }
      };
      // 重 mount 時重建 widget；siteKey 不會在 runtime 變動
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteKey]);

    return <div ref={containerRef} className="cf-turnstile flex justify-center" />;
  },
);
