import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useIsMobile } from "@/hooks/use-mobile";

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

describe("useIsMobile", () => {
  const listeners = new Set<EventListener>();
  const addEventListener = vi.fn(
    (event: string, listener: EventListenerOrEventListenerObject) => {
      if (event !== "change") return;
      if (typeof listener === "function") listeners.add(listener);
    },
  );
  const removeEventListener = vi.fn(
    (event: string, listener: EventListenerOrEventListenerObject) => {
      if (event !== "change") return;
      if (typeof listener === "function") listeners.delete(listener);
    },
  );

  beforeEach(() => {
    listeners.clear();
    addEventListener.mockClear();
    removeEventListener.mockClear();
    setViewport(1024);

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: window.innerWidth < 768,
        media: query,
        onchange: null,
        addEventListener,
        removeEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("returns false on desktop viewports", async () => {
    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("returns true on mobile viewports", async () => {
    setViewport(500);
    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("updates value when media query change events fire", async () => {
    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => expect(result.current).toBe(false));

    act(() => {
      setViewport(500);
      for (const listener of listeners) {
        listener(new Event("change"));
      }
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("removes the media query listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });
});
