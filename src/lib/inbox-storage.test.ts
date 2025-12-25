import { describe, it, expect, beforeEach } from "vitest";
import { storeInboxPath, getInboxPath, clearInboxPath } from "./inbox-storage";

describe("inbox-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores inbox path in localStorage", () => {
    storeInboxPath("Inbox");

    expect(localStorage.getItem("dropsidian_inbox_path")).toBe("Inbox");
  });

  it("retrieves stored inbox path", () => {
    localStorage.setItem("dropsidian_inbox_path", "GTD/Inbox");

    expect(getInboxPath()).toBe("GTD/Inbox");
  });

  it("returns null when no inbox path is stored", () => {
    expect(getInboxPath()).toBeNull();
  });

  it("clears inbox path from localStorage", () => {
    localStorage.setItem("dropsidian_inbox_path", "Inbox");

    clearInboxPath();

    expect(localStorage.getItem("dropsidian_inbox_path")).toBeNull();
  });
});
