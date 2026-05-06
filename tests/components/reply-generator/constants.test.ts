import { describe, it, expect } from "vitest";
import {
  SCENARIOS,
  OPTION_COLORS,
  getScenarioLabel,
} from "@/components/reply-generator/constants";

describe("SCENARIOS", () => {
  it("應該有 12 種情境", () => {
    expect(SCENARIOS).toHaveLength(12);
  });

  it("每個情境都有非空 value 與 label", () => {
    for (const s of SCENARIOS) {
      expect(s.value).toBeTruthy();
      expect(s.label).toBeTruthy();
    }
  });

  it("value 唯一", () => {
    const values = SCENARIOS.map((s) => s.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("OPTION_COLORS", () => {
  it("至少有與 SCENARIOS 等量的顏色", () => {
    expect(OPTION_COLORS.length).toBeGreaterThanOrEqual(SCENARIOS.length);
  });

  it("每個顏色都是 Tailwind text-* class", () => {
    for (const c of OPTION_COLORS) {
      expect(c).toMatch(/^text-[a-z]+-\d+$/);
    }
  });
});

describe("getScenarioLabel", () => {
  it("找到時返回對應 label", () => {
    expect(getScenarioLabel("Child Injury")).toBe("孩童受傷");
    expect(getScenarioLabel("Positive Feedback")).toBe("家長正面回饋");
  });

  it("找不到時 fallback 回 value 本身", () => {
    expect(getScenarioLabel("UnknownValue")).toBe("UnknownValue");
    expect(getScenarioLabel("")).toBe("");
  });
});
