import { describe, it, expect, beforeEach } from "vitest";
import { storeVaultPath, getVaultPath, clearVaultPath } from "./vault-storage";

describe("vault-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves vault path", () => {
    const path = "/Obsidian/MyVault";

    storeVaultPath(path);
    const retrieved = getVaultPath();

    expect(retrieved).toBe(path);
  });

  it("returns null when no vault path is stored", () => {
    const retrieved = getVaultPath();

    expect(retrieved).toBeNull();
  });

  it("clears stored vault path", () => {
    storeVaultPath("/vault-to-clear");

    clearVaultPath();
    const retrieved = getVaultPath();

    expect(retrieved).toBeNull();
  });
});

