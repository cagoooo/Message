import { describe, it, expect } from "vitest";
import { detectPII, maskPII } from "@/lib/pii-detector";

describe("detectPII", () => {
  it("空字串回傳空陣列", () => {
    expect(detectPII("")).toEqual([]);
  });

  it("普通文字回傳空陣列", () => {
    expect(detectPII("老師謝謝你的關心，我的孩子今天比較開心。")).toEqual([]);
  });

  it("偵測台灣身分證字號", () => {
    const w = detectPII("家長身分證 A123456789 已收到。");
    expect(w).toHaveLength(1);
    expect(w[0]?.type).toBe("身分證字號");
    expect(w[0]?.matches).toContain("A123456789");
  });

  it("偵測手機號碼（多種格式）", () => {
    const w1 = detectPII("聯絡電話 0912345678");
    expect(w1[0]?.type).toBe("手機號碼");
    expect(w1[0]?.matches).toContain("0912345678");

    const w2 = detectPII("聯絡電話 0912-345-678");
    expect(w2[0]?.type).toBe("手機號碼");
  });

  it("偵測信用卡號", () => {
    const w = detectPII("卡號 1234-5678-9012-3456");
    expect(w[0]?.type).toBe("信用卡號");
  });

  it("偵測 Email 信箱", () => {
    const w = detectPII("家長信箱 parent@example.com 來信表示...");
    expect(w[0]?.type).toBe("Email 信箱");
    expect(w[0]?.matches).toContain("parent@example.com");
  });

  it("一段含多種個資 → 多筆 warnings", () => {
    const w = detectPII(
      "家長 A123456789 手機 0912345678 email parent@school.tw",
    );
    expect(w).toHaveLength(3);
    expect(w.map((x) => x.type).sort()).toEqual(
      ["Email 信箱", "手機號碼", "身分證字號"],
    );
  });

  it("不誤判普通數字", () => {
    expect(detectPII("成績 95 分，第 3 名")).toEqual([]);
    expect(detectPII("體重 35.5 kg")).toEqual([]);
  });
});

describe("maskPII", () => {
  it("身分證字號遮罩中段", () => {
    expect(maskPII("A123456789")).toBe("A1******89");
  });

  it("手機遮罩", () => {
    expect(maskPII("0912345678")).toBe("09******78");
  });

  it("4 字元以下不遮罩", () => {
    expect(maskPII("ab")).toBe("ab");
    expect(maskPII("abcd")).toBe("abcd");
  });
});
