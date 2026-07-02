import { describe, expect, it, vi } from "vitest";
import { enableUnsupportedFileVisibility } from "./obsidian-config";

describe("enableUnsupportedFileVisibility", () => {
  it("sets showUnsupportedFiles when the vault exposes setConfig", () => {
    const setConfig = vi.fn();

    enableUnsupportedFileVisibility({ setConfig });

    expect(setConfig).toHaveBeenCalledWith("showUnsupportedFiles", true);
  });

  it("does not throw when setConfig is unavailable", () => {
    expect(() => enableUnsupportedFileVisibility({})).not.toThrow();
  });
});
