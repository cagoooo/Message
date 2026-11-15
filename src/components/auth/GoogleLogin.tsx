"use client";

import type { User } from "firebase/auth";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Google 官方四色 G 標誌 */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function GoogleSignInButton({
  onClick,
  signingIn,
  size = "default",
  className,
}: {
  onClick: () => void;
  signingIn: boolean;
  size?: "default" | "lg" | "sm";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={signingIn}
      className={cn(
        "rounded-full bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold dark:bg-white dark:text-slate-800",
        size === "lg" && "px-7 py-6 text-base",
        className,
      )}
    >
      {signingIn ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <GoogleG className="mr-2 h-5 w-5" />
      )}
      {signingIn ? "登入中…" : "使用 Google 帳號登入"}
    </Button>
  );
}

/**
 * 對話卡上方的登入狀態列：
 * - 未登入：提示「請先用 Google 帳號登入」+ 登入按鈕
 * - 已登入：顯示登入者名稱與「登出」
 */
export function AuthStatusBar({
  user,
  loading,
  signingIn,
  onSignIn,
  onSignOut,
}: {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  if (loading) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        確認登入狀態中…
      </div>
    );
  }

  if (!user) {
    return (
      <div
        role="status"
        className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-r from-primary/10 via-secondary/50 to-accent/10 px-4 py-4 sm:px-5"
      >
        <div className="flex items-start gap-3 min-w-0">
          <ShieldCheck className="h-6 w-6 shrink-0 text-primary mt-0.5" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-foreground">
              請先用 Google 帳號登入
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              登入後才能使用 AI 產生與調整家長回覆。任何 Google 帳號都可以，不會讀取您的信件或檔案。
            </p>
          </div>
        </div>
        <GoogleSignInButton
          onClick={onSignIn}
          signingIn={signingIn}
          className="w-full sm:w-auto shrink-0"
        />
      </div>
    );
  }

  const name = user.displayName || user.email || "Google 使用者";
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300/70 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-800 px-4 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full border border-white shadow-sm shrink-0"
          />
        ) : (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            {name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-semibold text-foreground truncate">
            已登入：{name}
          </p>
          {user.email && user.displayName && (
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onSignOut}
        className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
      >
        <LogOut className="mr-1.5 h-4 w-4" />
        登出
      </Button>
    </div>
  );
}
