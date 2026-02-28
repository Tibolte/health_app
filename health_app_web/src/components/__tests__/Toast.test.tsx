// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { Toast, useToast } from "../Toast";

describe("Toast component", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the message", () => {
    render(<Toast message="Sync complete" type="success" onClose={() => {}} />);
    expect(screen.getByText("Sync complete")).toBeInTheDocument();
  });

  it("uses green background for success type", () => {
    render(<Toast message="OK" type="success" onClose={() => {}} />);
    const el = screen.getByText("OK");
    expect(el.style.background).toBe("rgb(52, 211, 153)"); // #34d399
  });

  it("uses red background for error type", () => {
    render(<Toast message="Failed" type="error" onClose={() => {}} />);
    const el = screen.getByText("Failed");
    expect(el.style.background).toBe("rgb(251, 113, 133)"); // #fb7185
  });

  it("auto-dismisses after 4 seconds", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<Toast message="Test" type="success" onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("useToast hook", () => {
  it("starts with null toast state", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeNull();
  });

  it("shows toast with showToast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Hello", "success");
    });

    expect(result.current.toast).toEqual({
      message: "Hello",
      type: "success",
      visible: true,
    });
  });

  it("hides toast with hideToast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Hello", "success");
    });

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast).toBeNull();
  });
});
