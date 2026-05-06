import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

function setClipboard(impl: ((text: string) => Promise<void>) | null) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: impl ? { writeText: impl } : undefined,
  });
}

function setExecCommand(impl: () => boolean) {
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    writable: true,
    value: impl,
  });
}

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    toastMock.mockClear();
  });

  it("Clipboard API 成功 → 回傳 true 且觸發 success toast", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);

    const { result } = renderHook(() => useCopyToClipboard());
    const ok = await result.current("hello world");

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello world");
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success" }),
    );
  });

  it("Clipboard API throw → fallback 到 execCommand", async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error("api fail")));
    const exec = vi.fn().mockReturnValue(true);
    setExecCommand(exec);

    const { result } = renderHook(() => useCopyToClipboard());
    const ok = await result.current("fallback");

    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success" }),
    );
  });

  it("沒有 Clipboard API → 直接走 execCommand", async () => {
    setClipboard(null);
    const exec = vi.fn().mockReturnValue(true);
    setExecCommand(exec);

    const { result } = renderHook(() => useCopyToClipboard());
    const ok = await result.current("no api browser");

    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalled();
  });

  it("空字串 → 不執行任何複製，回傳 false", async () => {
    const writeText = vi.fn();
    setClipboard(writeText);

    const { result } = renderHook(() => useCopyToClipboard());
    const ok = await result.current("");

    expect(ok).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("自訂 label → toast title 含該 label", async () => {
    setClipboard(vi.fn().mockResolvedValue(undefined));

    const { result } = renderHook(() => useCopyToClipboard());
    await result.current("text", "建議");

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("建議"),
      }),
    );
  });

  it("Clipboard API 與 execCommand 都失敗 → 回傳 false 且觸發 destructive toast", async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error("clipboard fail")));
    setExecCommand(vi.fn().mockReturnValue(false));

    const { result } = renderHook(() => useCopyToClipboard());
    const ok = await result.current("text");

    expect(ok).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });
});
