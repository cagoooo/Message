import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useHistory } from "@/hooks/use-history";

const STORAGE_KEY = "teachers-ai-history-v1";
const MAX = 20;

const sampleEntry = (override: Partial<{
  scenario: string;
  scenarioLabel: string;
  parentMessage: string;
  reply: string;
}> = {}) => ({
  scenario: "Child Injury",
  scenarioLabel: "孩童受傷",
  parentMessage: "孩子在學校跌倒",
  reply: "感謝家長關心，我們會...",
  ...override,
});

describe("useHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("初始狀態為空陣列且 hydrated=true", () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.items).toEqual([]);
    expect(result.current.hydrated).toBe(true);
    expect(result.current.max).toBe(MAX);
  });

  it("add 後出現在 items 第一個（含自動產生的 id 與 ts）", () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.add(sampleEntry({ parentMessage: "測試訊息" }));
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].parentMessage).toBe("測試訊息");
    expect(result.current.items[0].id).toBeTruthy();
    expect(result.current.items[0].ts).toBeGreaterThan(0);
  });

  it("最新的 add 永遠在第 0 位（LIFO）", () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.add(sampleEntry({ parentMessage: "first" }));
    });
    act(() => {
      result.current.add(sampleEntry({ parentMessage: "second" }));
    });
    expect(result.current.items[0].parentMessage).toBe("second");
    expect(result.current.items[1].parentMessage).toBe("first");
  });

  it(`超過 ${MAX} 筆時保留最新 ${MAX} 筆`, () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      for (let i = 0; i < MAX + 5; i++) {
        result.current.add(sampleEntry({ parentMessage: `msg-${i}` }));
      }
    });
    expect(result.current.items).toHaveLength(MAX);
    // 最新的 msg-24 在第 0 位
    expect(result.current.items[0].parentMessage).toBe(`msg-${MAX + 4}`);
    // 最舊的 msg-5 在最後（msg-0~4 已被擠出）
    expect(result.current.items[MAX - 1].parentMessage).toBe("msg-5");
  });

  it("remove 刪除指定 id 後其他不受影響", () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.add(sampleEntry({ parentMessage: "A" }));
      result.current.add(sampleEntry({ parentMessage: "B" }));
      result.current.add(sampleEntry({ parentMessage: "C" }));
    });
    const targetId = result.current.items[1].id; // "B"
    act(() => {
      result.current.remove(targetId);
    });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.map((e) => e.parentMessage)).toEqual(["C", "A"]);
  });

  it("clear 清空全部", () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.add(sampleEntry({ parentMessage: "A" }));
      result.current.add(sampleEntry({ parentMessage: "B" }));
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.items).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("[]");
  });

  it("跨 hook instance 共用 localStorage（持久化驗證）", () => {
    const first = renderHook(() => useHistory());
    act(() => {
      first.result.current.add(sampleEntry({ parentMessage: "persist this" }));
    });
    first.unmount();

    const second = renderHook(() => useHistory());
    expect(second.result.current.items).toHaveLength(1);
    expect(second.result.current.items[0].parentMessage).toBe("persist this");
  });

  it("localStorage 含損壞 JSON 時不 crash，回傳空陣列", () => {
    localStorage.setItem(STORAGE_KEY, "{this is not valid json");
    const { result } = renderHook(() => useHistory());
    expect(result.current.items).toEqual([]);
  });

  it("localStorage 含非陣列時回傳空陣列", () => {
    localStorage.setItem(STORAGE_KEY, '{"foo":"bar"}');
    const { result } = renderHook(() => useHistory());
    expect(result.current.items).toEqual([]);
  });

  it("過濾 schema 不正確的 entries", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "valid-1",
          ts: 100,
          scenario: "A",
          scenarioLabel: "情境 A",
          parentMessage: "valid msg",
          reply: "valid reply",
        },
        { foo: "missing-fields" },
        null,
        "not an object",
        {
          id: 123, // 錯誤型別
          ts: 100,
          scenario: "X",
          parentMessage: "x",
          reply: "x",
        },
      ]),
    );
    const { result } = renderHook(() => useHistory());
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe("valid-1");
  });
});
