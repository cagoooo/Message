"use client";

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * 複製文字到剪貼簿。先試 Clipboard API，失敗時 fallback 到 execCommand。
 * 自動跳出 toast 顯示成功 / 失敗訊息。
 */
export function useCopyToClipboard() {
  const { toast } = useToast();

  return useCallback(
    async (text: string, label: string = "回覆"): Promise<boolean> => {
      if (!text) return false;

      let ok = false;

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          ok = true;
        } catch (err) {
          console.warn("Clipboard API failed, fallback:", err);
        }
      }

      if (!ok) {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          ta.style.top = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          ok = document.execCommand("copy");
          document.body.removeChild(ta);
        } catch (err) {
          console.error("Fallback copy failed:", err);
        }
      }

      if (ok) {
        toast({
          title: `${label}已複製！`,
          description: "已複製到您的剪貼簿。",
          variant: "success",
        });
      } else {
        toast({
          variant: "destructive",
          title: "複製失敗",
          description: "抱歉，無法自動複製。請手動選取複製。",
        });
      }
      return ok;
    },
    [toast],
  );
}
