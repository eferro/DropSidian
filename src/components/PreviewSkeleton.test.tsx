import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PreviewSkeleton from "./PreviewSkeleton";

describe("PreviewSkeleton", () => {
  it("renders skeleton placeholder", () => {
    render(<PreviewSkeleton />);
    const skeleton = screen.getByTestId("preview-skeleton");
    expect(skeleton).toBeInTheDocument();
  });
});
