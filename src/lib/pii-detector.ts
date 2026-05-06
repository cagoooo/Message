/**
 * 簡易個資偵測（client-side regex）
 *
 * 設計理念：
 * - 寧可漏報、避免誤報太多影響使用體驗
 * - 偵測常見「明顯」格式，如身分證字號、手機、信用卡、Email
 * - 學生姓名、住址等不偵測（誤判率太高）
 *
 * 用途：表單送出前提醒老師「您的訊息含 X，建議移除後再送」，
 * 但不強制阻擋（老師有權自行判斷是否需要這份資訊）。
 */

export type PIIType =
  | "身分證字號"
  | "手機號碼"
  | "信用卡號"
  | "Email 信箱";

export interface PIIWarning {
  type: PIIType;
  matches: string[]; // 偵測到的具體字串（用於提示時 mask 顯示）
}

// 台灣身分證：[A-Z][1-2]\d{8}
const TW_ID_PATTERN = /\b[A-Z][12]\d{8}\b/g;

// 手機：09 開頭 10 位數字，可能含 - 或空白
const TW_MOBILE_PATTERN = /\b09\d{2}[-\s]?\d{3}[-\s]?\d{3}\b/g;

// 信用卡：4 組 4 位數，可能含 - 或空白
const CREDIT_CARD_PATTERN = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

// Email
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function detectPII(text: string): PIIWarning[] {
  if (!text) return [];

  const warnings: PIIWarning[] = [];

  const ids = text.match(TW_ID_PATTERN);
  if (ids?.length) warnings.push({ type: "身分證字號", matches: ids });

  const mobiles = text.match(TW_MOBILE_PATTERN);
  if (mobiles?.length) warnings.push({ type: "手機號碼", matches: mobiles });

  const ccs = text.match(CREDIT_CARD_PATTERN);
  if (ccs?.length) warnings.push({ type: "信用卡號", matches: ccs });

  const emails = text.match(EMAIL_PATTERN);
  if (emails?.length) warnings.push({ type: "Email 信箱", matches: emails });

  return warnings;
}

/**
 * 把偵測到的字串部分遮罩。例：A123456789 → A1******89
 */
export function maskPII(value: string): string {
  if (value.length <= 4) return value;
  const head = value.slice(0, 2);
  const tail = value.slice(-2);
  return `${head}${"*".repeat(value.length - 4)}${tail}`;
}
