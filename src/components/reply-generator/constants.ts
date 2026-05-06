export type Scenario = { value: string; label: string };

export const SCENARIOS: Scenario[] = [
  { value: "Child Injury", label: "孩童受傷" },
  { value: "Serious Conflict", label: "嚴重衝突" },
  { value: "Irrational Message", label: "回應不理性訊息" },
  { value: "Academic Concern", label: "學業問題" },
  { value: "Behavioral Issue", label: "行為問題" },
  { value: "Positive Feedback", label: "家長正面回饋" },
  { value: "Request for Meeting", label: "家長要求會面" },
  { value: "Missed Homework/Assignment", label: "缺交作業" },
  { value: "Upcoming Event Inquiry", label: "活動詢問" },
  { value: "Health Concern", label: "健康問題（如過敏、生病）" },
  { value: "General Inquiry", label: "一般詢問" },
  { value: "Other", label: "其他" },
];

export const OPTION_COLORS = [
  "text-red-500",
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-purple-500",
  "text-pink-500",
  "text-indigo-500",
  "text-teal-500",
  "text-orange-500",
  "text-cyan-500",
  "text-lime-500",
  "text-emerald-500",
];

export function getScenarioLabel(value: string): string {
  return SCENARIOS.find((s) => s.value === value)?.label ?? value;
}
