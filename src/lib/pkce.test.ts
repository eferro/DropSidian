import { describe, it, expect } from "vitest";
import { generateCodeVerifier } from "./pkce";

describe("generateCodeVerifier", () => {
  it("generates a string of 64 characters", () => {
    const verifier = generateCodeVerifier();

    expect(verifier).toHaveLength(64);
  });
});

