"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

/**
 * 隱藏式管理員後台快捷入口（左下角浮動）。
 *
 * 設計：
 * - opacity 0.15 預設「幾乎看不到」，但管理員知道位置可點
 * - hover / focus 時放大 + 完全顯現（給意外撞到滑鼠的提示）
 * - z-index 30，低於 InstallPrompt (z-50) / Toaster 避免衝突
 * - 在 /stats 自己不顯示（已在後台不用再連去後台）
 */
export function AdminAccessButton() {
  const pathname = usePathname();
  if (pathname?.includes("/stats")) return null;

  return (
    <motion.div
      className="fixed bottom-4 left-4 z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.15 }}
      whileHover={{ opacity: 1, scale: 1.15 }}
      whileFocus={{ opacity: 1, scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Link
        href="/stats"
        aria-label="進入管理員後台統計"
        title="📊 管理員後台"
        className="block text-2xl select-none rounded-full p-2 hover:bg-primary/10 focus:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span role="img" aria-hidden>
          📊
        </span>
      </Link>
    </motion.div>
  );
}
