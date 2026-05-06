import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFakeProgress } from "@/hooks/use-fake-progress";

describe("useFakeProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("isPending=false / hasResult=false → 0", () => {
    const { result } = renderHook(() => useFakeProgress(false, false));
    expect(result.current).toBe(0);
  });

  it("isPending=true 起始值為 10", () => {
    const { result } = renderHook(() => useFakeProgress(true, false));
    expect(result.current).toBe(10);
  });

  it("時間經過後逐漸增加，但封頂在 95", () => {
    const { result } = renderHook(() => useFakeProgress(true, false));
    act(() => {
      vi.advanceTimersByTime(400 * 30); // 30 ticks，足夠到 95
    });
    expect(result.current).toBe(95);
  });

  it("hasResult=true → 立刻跳 100，500ms 後回 0", () => {
    const { result, rerender } = renderHook(
      ({ pending, hasResult }: { pending: boolean; hasResult: boolean }) =>
        useFakeProgress(pending, hasResult),
      { initialProps: { pending: true, hasResult: false } },
    );

    rerender({ pending: false, hasResult: true });
    expect(result.current).toBe(100);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(0);
  });

  it("從 pending 切回 idle（無結果）→ 重置為 0", () => {
    const { result, rerender } = renderHook(
      ({ pending }: { pending: boolean }) => useFakeProgress(pending, false),
      { initialProps: { pending: true } },
    );

    expect(result.current).toBe(10);

    rerender({ pending: false });
    expect(result.current).toBe(0);
  });
});
