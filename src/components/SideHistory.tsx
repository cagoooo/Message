"use client";

// 側欄歷史紀錄列表 — Direction A 設計檔風格
// 與 HistoryPanel 共用 useHistory hook，但 UI 為直接列出（非按鈕觸發）
import type { HistoryEntry } from "@/hooks/use-history";
import { getScenario } from "@/components/reply-generator/constants";

interface SideHistoryProps {
  items: HistoryEntry[];
  onApply: (entry: HistoryEntry) => void;
}

const ZH_TIME_FMT = new Intl.DateTimeFormat("zh-Hant", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatTime(ts: number): string {
  const now = Date.now();
  const diffMs = now - ts;
  const oneDay = 24 * 60 * 60 * 1000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tsDate = new Date(ts);
  const tsDayStart = new Date(tsDate);
  tsDayStart.setHours(0, 0, 0, 0);

  if (tsDayStart.getTime() === todayStart.getTime()) {
    return ZH_TIME_FMT.format(tsDate);
  }
  if (todayStart.getTime() - tsDayStart.getTime() === oneDay) {
    return "昨天";
  }
  if (diffMs < 7 * oneDay) {
    return `${tsDate.getMonth() + 1}/${tsDate.getDate()}`;
  }
  return `${tsDate.getMonth() + 1}/${tsDate.getDate()}`;
}

function previewOf(reply: string, parentMessage: string): string {
  const src = (reply || parentMessage || "").trim();
  const firstLine = src.split("\n").find((l) => l.trim()) ?? "";
  return firstLine.length > 40 ? firstLine.slice(0, 40) + "…" : firstLine;
}

export function SideHistory({ items, onApply }: SideHistoryProps) {
  return (
    <aside className="space-y-4">
      <h3 className="da-side-h3">
        最近回覆 <span className="badge">{items.length}</span>
      </h3>
      <div className="da-side-card">
        <div className="da-hist-list">
          {items.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              尚無紀錄。產生第一則回覆後會自動上架。
            </div>
          )}
          {items.map((h) => {
            const sc = getScenario(h.scenario);
            return (
              <button
                key={h.id}
                type="button"
                className="da-hist-item"
                onClick={() => onApply(h)}
              >
                <div
                  className="ic"
                  style={{ background: sc.color + "22", color: sc.color }}
                >
                  {sc.icon}
                </div>
                <div className="body">
                  <div className="hh">
                    <strong>{sc.label}</strong>
                    <span className="t">{formatTime(h.ts)}</span>
                  </div>
                  <p>{previewOf(h.reply, h.parentMessage)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="da-tip">
        <div className="lab">💡 小提醒</div>
        <h4>越具體，回覆越有溫度</h4>
        <p>提到孩子的名字、發生時間、現場感受，小幫手就能寫出更貼近的內容。</p>
      </div>
    </aside>
  );
}
