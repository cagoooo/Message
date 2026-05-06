"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trash2, Copy, RotateCcw, FileX } from "lucide-react";
import type { HistoryEntry } from "@/hooks/use-history";

interface HistoryPanelProps {
  items: HistoryEntry[];
  max: number;
  onApply: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCopy: (text: string) => void;
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "剛剛";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分鐘前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小時前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function HistoryPanel({
  items,
  max,
  onApply,
  onRemove,
  onClear,
  onCopy,
}: HistoryPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 transition-transform hover:scale-105"
        >
          <History className="h-4 w-4" />
          歷史紀錄
          {items.length > 0 && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 min-w-[1.5rem] text-center">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            歷史紀錄
          </SheetTitle>
          <SheetDescription>
            最近 {items.length} / {max} 筆，僅儲存在這台裝置（不上雲端）。
            清除瀏覽器資料會同時清空。
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 py-12">
            <FileX className="h-16 w-16 opacity-40" />
            <p className="text-sm">還沒有紀錄</p>
            <p className="text-xs text-muted-foreground/70">
              產生第一份回覆後會自動存到這裡
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mr-3 pr-3">
              <motion.div
                className="space-y-3 pb-2"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.04 } },
                }}
              >
                <AnimatePresence initial={false}>
                  {items.map((entry) => (
                    <motion.article
                      key={entry.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        show: { opacity: 1, x: 0 },
                      }}
                      exit={{ opacity: 0, x: -20, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                      transition={{ type: "spring", stiffness: 280, damping: 26 }}
                      className="border border-border rounded-lg p-3 space-y-2 bg-card hover:shadow-md transition-shadow overflow-hidden"
                    >
                    <header className="flex items-center justify-between text-xs">
                      <span className="bg-secondary/60 px-2 py-1 rounded font-medium text-secondary-foreground">
                        {entry.scenarioLabel}
                      </span>
                      <span className="text-muted-foreground">
                        {formatTime(entry.ts)}
                      </span>
                    </header>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <span className="font-semibold text-foreground">
                        家長：
                      </span>
                      {entry.parentMessage}
                    </p>
                    <p className="text-sm line-clamp-3 leading-relaxed">
                      <span className="font-semibold text-primary">
                        建議：
                      </span>
                      {entry.reply}
                    </p>
                    <div className="flex gap-1 pt-1 -mb-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2"
                        onClick={() => onCopy(entry.reply)}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        複製回覆
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2"
                        onClick={() => {
                          onApply(entry);
                          setOpen(false);
                        }}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        套回表單
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemove(entry.id)}
                        aria-label="刪除這筆"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </motion.div>
            </ScrollArea>
            <div className="border-t border-border pt-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (window.confirm("確定要清空所有歷史紀錄嗎？此動作無法復原。")) {
                    onClear();
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                清空全部
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
