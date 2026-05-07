// 12 種情境設定 — 對齊 Direction A 設計檔
// icon / color 為 Direction A 移植自設計原型，提供視覺辨識度
export type Scenario = {
  value: string;
  label: string;
  /** Emoji 圖示，與設計檔對齊 */
  icon: string;
  /** 該情境主題色 (hex)，用於下拉選單與標籤的色塊 */
  color: string;
};

export const SCENARIOS: Scenario[] = [
  { value: "Child Injury",                label: "孩童受傷",          icon: "🩹", color: "#ef6b50" },
  { value: "Serious Conflict",            label: "嚴重衝突",          icon: "⚡", color: "#e08736" },
  { value: "Irrational Message",          label: "回應不理性訊息",    icon: "🌪",  color: "#d04e7a" },
  { value: "Academic Concern",            label: "學業問題",          icon: "📘", color: "#3d6fc4" },
  { value: "Behavioral Issue",            label: "行為問題",          icon: "🧭", color: "#7b5dd6" },
  { value: "Positive Feedback",           label: "家長正面回饋",      icon: "🌱", color: "#3ea675" },
  { value: "Request for Meeting",         label: "家長要求會面",      icon: "🗓",  color: "#5a6fd6" },
  { value: "Missed Homework/Assignment",  label: "缺交作業",          icon: "📝", color: "#d68e2a" },
  { value: "Upcoming Event Inquiry",      label: "活動詢問",          icon: "🎈", color: "#c84a8e" },
  { value: "Health Concern",              label: "健康問題（如過敏、生病）", icon: "💊", color: "#3aa9b0" },
  { value: "General Inquiry",             label: "一般詢問",          icon: "💬", color: "#5a7fd6" },
  { value: "Other",                       label: "其他",              icon: "✨", color: "#a880c8" },
];

/**
 * 舊版逐索引顏色（Tailwind class），給尚未遷移到 SCENARIOS.color 的呼叫處使用。
 * 新程式請改用 SCENARIOS[i].color (hex) 搭配 inline style。
 */
export const OPTION_COLORS = [
  "text-rose-600",
  "text-orange-600",
  "text-pink-600",
  "text-blue-600",
  "text-violet-600",
  "text-emerald-600",
  "text-indigo-600",
  "text-amber-600",
  "text-fuchsia-600",
  "text-teal-600",
  "text-sky-600",
  "text-purple-600",
];

export function getScenarioLabel(value: string): string {
  return SCENARIOS.find((s) => s.value === value)?.label ?? value;
}

/** 取得情境完整資料（含 icon、color）；找不到時回傳第一個避免 undefined。 */
export function getScenario(value: string): Scenario {
  return SCENARIOS.find((s) => s.value === value) ?? SCENARIOS[0];
}
