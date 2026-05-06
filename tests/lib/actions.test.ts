import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Firebase modules — generateReply 透過 httpsCallable 與 getFn 呼叫
const httpsCallableMock = vi.fn();
vi.mock("firebase/functions", () => ({
  httpsCallable: () => httpsCallableMock,
  getFunctions: vi.fn(),
}));
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
  getApps: () => [],
}));
vi.mock("@/lib/firebase", () => ({
  getFn: vi.fn(),
}));

// 在 mocks 之後再 import 受測模組
import { generateReply } from "@/lib/actions";

describe("generateReply — zod 驗證", () => {
  beforeEach(() => {
    httpsCallableMock.mockReset();
  });

  it("scenario 為空 → fieldErrors.scenario", async () => {
    const r = await generateReply({
      scenario: "",
      parentMessage: "正常訊息",
      turnstileToken: "tk",
    });
    expect(r.error).toBeTruthy();
    expect(r.fieldErrors?.scenario?.[0]).toBe("必須填寫情境。");
    expect(httpsCallableMock).not.toHaveBeenCalled();
  });

  it("parentMessage 為空 → fieldErrors.parentMessage", async () => {
    const r = await generateReply({
      scenario: "Child Injury",
      parentMessage: "",
      turnstileToken: "tk",
    });
    expect(r.error).toBeTruthy();
    expect(r.fieldErrors?.parentMessage?.[0]).toBe("家長訊息不能為空。");
    expect(httpsCallableMock).not.toHaveBeenCalled();
  });

  it("turnstileToken 為空 → fieldErrors.turnstileToken", async () => {
    const r = await generateReply({
      scenario: "Child Injury",
      parentMessage: "正常訊息",
      turnstileToken: "",
    });
    expect(r.error).toBeTruthy();
    expect(r.fieldErrors?.turnstileToken?.[0]).toBe("請先完成人機驗證。");
    expect(httpsCallableMock).not.toHaveBeenCalled();
  });

  it("zod 驗證失敗時 callable 不會被呼叫（節省 quota）", async () => {
    await generateReply({ scenario: "", parentMessage: "", turnstileToken: "" });
    expect(httpsCallableMock).not.toHaveBeenCalled();
  });
});

describe("generateReply — 成功路徑", () => {
  beforeEach(() => {
    httpsCallableMock.mockReset();
  });

  it("收到 reply 時回傳 { reply }", async () => {
    httpsCallableMock.mockResolvedValue({ data: { reply: "AI 建議回覆" } });
    const r = await generateReply({
      scenario: "Child Injury",
      parentMessage: "孩子在校跌倒",
      turnstileToken: "tk",
    });
    expect(r.reply).toBe("AI 建議回覆");
    expect(r.error).toBeUndefined();
  });

  it("有效輸入會把 turnstileToken 一併傳給 callable", async () => {
    httpsCallableMock.mockResolvedValue({ data: { reply: "x" } });
    await generateReply({
      scenario: "Child Injury",
      parentMessage: "msg",
      turnstileToken: "specific-token-xyz",
    });
    expect(httpsCallableMock).toHaveBeenCalledWith({
      scenario: "Child Injury",
      parentMessage: "msg",
      turnstileToken: "specific-token-xyz",
    });
  });
});

describe("generateReply — 錯誤路徑", () => {
  beforeEach(() => {
    httpsCallableMock.mockReset();
  });

  it("callable 回 reply 為空字串 → 提示產生失敗", async () => {
    httpsCallableMock.mockResolvedValue({ data: { reply: "" } });
    const r = await generateReply({
      scenario: "A",
      parentMessage: "msg",
      turnstileToken: "tk",
    });
    expect(r.reply).toBeUndefined();
    expect(r.error).toBe("產生回覆失敗。小幫手未提供回應。");
  });

  it("callable 回 data 缺 reply 欄位 → 提示產生失敗", async () => {
    httpsCallableMock.mockResolvedValue({ data: {} });
    const r = await generateReply({
      scenario: "A",
      parentMessage: "msg",
      turnstileToken: "tk",
    });
    expect(r.error).toBe("產生回覆失敗。小幫手未提供回應。");
  });

  it("callable throw Error → 直接回傳 error.message（不再加前綴）", async () => {
    httpsCallableMock.mockRejectedValue(
      new Error("AI 服務暫時繁忙，請稍候 30 秒再試。"),
    );
    const r = await generateReply({
      scenario: "A",
      parentMessage: "msg",
      turnstileToken: "tk",
    });
    expect(r.error).toBe("AI 服務暫時繁忙，請稍候 30 秒再試。");
    expect(r.error).not.toContain("小幫手錯誤："); // 確認沒重複前綴
  });

  it("callable throw 非 Error 物件 → fallback 文字", async () => {
    httpsCallableMock.mockRejectedValue("plain string error");
    const r = await generateReply({
      scenario: "A",
      parentMessage: "msg",
      turnstileToken: "tk",
    });
    expect(r.error).toBe("回覆產生時發生未知錯誤，請稍後重試。");
  });
});
