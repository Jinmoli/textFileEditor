import { describe, expect, it, vi } from "vitest";
import { registerTextFileExtensions } from "./extension-registration";

describe("registerTextFileExtensions", () => {
  it("continues registering later extensions when one extension is already taken", () => {
    const registerExtension = vi.fn((extension: string, viewType: string) => {
      expect(viewType).toBe("text-file-editor-view");
      if (extension === "json") {
        throw new Error("Extension json is already registered");
      }
    });
    const warn = vi.fn();

    const result = registerTextFileExtensions({
      requestedExtensions: ["txt", "json", "sql"],
      viewType: "text-file-editor-view",
      registerExtension,
      warn
    });

    expect(registerExtension).toHaveBeenCalledTimes(3);
    expect(result.registeredExtensions).toEqual(["txt", "sql"]);
    expect(result.skippedExtensions).toEqual(["json"]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("扩展名 .json 注册失败"),
      expect.any(Error)
    );
  });
});
