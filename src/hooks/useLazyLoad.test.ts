import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLazyLoad } from "./useLazyLoad";

describe("useLazyLoad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false initially when not in viewport", () => {
    const { result } = renderHook(() => useLazyLoad());
    expect(result.current.isVisible).toBe(false);
    expect(result.current.ref).toBeDefined();
  });
});
