import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  normalizePositiveNumber,
  parseExtensionInput,
  validateSupportedExtensions
} from "./settings-core";

describe("settings", () => {
  it("does not open the separate text file list on startup by default", () => {
    expect(DEFAULT_SETTINGS.autoOpenFileList).toBe(false);
    expect(mergeSettings({ autoOpenFileList: true }).autoOpenFileList).toBe(true);
  });

  it("shows line numbers by default and preserves a saved opt-out", () => {
    expect(DEFAULT_SETTINGS.showLineNumbers).toBe(true);
    expect(mergeSettings({ showLineNumbers: false }).showLineNumbers).toBe(false);
  });

  it("merges saved settings with defaults and normalizes extensions", () => {
    const merged = mergeSettings({
        defaultReadOnly: true,
        encoding: "gbk",
        largeFileWarningSizeMb: 8,
        showLineNumbers: false,
        supportedExtensions: ["SQL", ".json", "sql"]
      });

    expect(merged).toMatchObject({
      autoSaveDraftIntervalSeconds: DEFAULT_SETTINGS.autoSaveDraftIntervalSeconds,
      defaultReadOnly: true,
      defaultWordWrap: DEFAULT_SETTINGS.defaultWordWrap,
      encoding: "gbk",
      largeFileWarningSizeMb: 8,
      autoOpenFileList: DEFAULT_SETTINGS.autoOpenFileList,
      showLineNumbers: false,
      saveShortcutHint: DEFAULT_SETTINGS.saveShortcutHint
    });
    expect(merged.supportedExtensions.slice(0, 2)).toEqual(["sql", "json"]);
  });

  it("keeps newly added default extensions when merging an older saved extension list", () => {
    const merged = mergeSettings({
      supportedExtensions: ["txt", "sql"]
    });

    expect(merged.supportedExtensions).toContain("txt");
    expect(merged.supportedExtensions).toContain("sql");
    expect(merged.supportedExtensions).toContain("sh");
    expect(merged.supportedExtensions).toContain("bat");
    expect(merged.supportedExtensions).toContain("ps1");
    expect(merged.supportedExtensions).toContain("toml");
    expect(merged.supportedExtensions).toContain("env");
    expect(merged.supportedExtensions).toContain("dockerfile");
    expect(merged.supportedExtensions).toContain("gradle");
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

  it("normalizes numeric settings with a safe fallback", () => {
    expect(normalizePositiveNumber("10", 5)).toBe(10);
    expect(normalizePositiveNumber(-1, 5)).toBe(5);
    expect(normalizePositiveNumber("bad", 5)).toBe(5);
  });
});
