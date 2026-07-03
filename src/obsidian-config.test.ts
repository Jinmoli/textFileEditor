import { describe, expect, it, vi } from "vitest";
import { enableUnsupportedFileVisibility } from "./obsidian-config";

describe("enableUnsupportedFileVisibility", () => {
  it("sets showUnsupportedFiles when the vault exposes setConfig", () => {
    const setConfig = vi.fn();

    enableUnsupportedFileVisibility({ vault: { setConfig } });

    expect(setConfig).toHaveBeenCalledWith("showUnsupportedFiles", true);
  });

  it("does not throw when setConfig is unavailable", () => {
    expect(() => enableUnsupportedFileVisibility({ vault: {} })).not.toThrow();
  });

  it("refreshes file explorer views when refresh hooks are available", () => {
    const setConfig = vi.fn();
    const refresh = vi.fn();
    const requestSort = vi.fn();

    enableUnsupportedFileVisibility({
      vault: { setConfig },
      workspace: {
        getLeavesOfType: vi.fn().mockReturnValue([
          {
            view: {
              refresh,
              requestSort
            }
          }
        ])
      }
    });

    expect(setConfig).toHaveBeenCalledWith("showUnsupportedFiles", true);
    expect(requestSort).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
