import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  parseExtensionInput,
  validateSupportedExtensions
} from "./settings-core";

describe("settings", () => {
  it("does not open the separate text file list on startup by default", () => {
    expect(DEFAULT_SETTINGS.autoOpenFileList).toBe(false);
    expect(mergeSettings({ autoOpenFileList: true }).autoOpenFileList).toBe(true);
  });

  it("merges saved settings with defaults and normalizes extensions", () => {
    expect(
      mergeSettings({
        defaultReadOnly: true,
        supportedExtensions: ["SQL", ".json", "sql"]
      })
    ).toEqual({
      defaultReadOnly: true,
      defaultWordWrap: DEFAULT_SETTINGS.defaultWordWrap,
      autoOpenFileList: DEFAULT_SETTINGS.autoOpenFileList,
      saveShortcutHint: DEFAULT_SETTINGS.saveShortcutHint,
      supportedExtensions: ["sql", "json"]
    });
  });

  it("parses comma, whitespace, and newline separated extension input", () => {
    expect(parseExtensionInput("txt, sql\n.json  yml")).toEqual(["txt", "sql", "json", "yml"]);
  });

  it("returns precise validation errors for invalid extensions", () => {
    expect(validateSupportedExtensions([])).toEqual({
      ok: false,
      message: "请至少保留一个可打开的文件扩展名。"
    });
    expect(validateSupportedExtensions(["good", "bad/name"])).toEqual({
      ok: false,
      message: "扩展名“bad/name”不能包含路径分隔符。"
    });
  });

  it("accepts a clean extension list", () => {
    expect(validateSupportedExtensions(["txt", "sql"])).toEqual({ ok: true });
  });
});
