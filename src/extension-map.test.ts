import { describe, expect, it } from "vitest";
import {
  DEFAULT_SUPPORTED_EXTENSIONS,
  getExtensionLanguageKey,
  isSupportedExtension,
  normalizeExtension,
  normalizeExtensionList
} from "./extension-map";

describe("extension-map", () => {
  it("normalizes extensions by trimming, removing the leading dot, and lowercasing", () => {
    expect(normalizeExtension(" .SQL ")).toBe("sql");
    expect(normalizeExtension("json")).toBe("json");
  });

  it("removes duplicate and empty extensions while preserving first-seen order", () => {
    expect(normalizeExtensionList(["SQL", ".sql", " ", "Json"])).toEqual(["sql", "json"]);
  });

  it("detects supported extensions after normalization", () => {
    expect(isSupportedExtension(".YML", DEFAULT_SUPPORTED_EXTENSIONS)).toBe(true);
    expect(isSupportedExtension(".java", DEFAULT_SUPPORTED_EXTENSIONS)).toBe(true);
    expect(isSupportedExtension("exe", DEFAULT_SUPPORTED_EXTENSIONS)).toBe(false);
  });

  it("maps known extensions to language keys", () => {
    expect(getExtensionLanguageKey("json")).toBe("json");
    expect(getExtensionLanguageKey("yaml")).toBe("yaml");
    expect(getExtensionLanguageKey("yml")).toBe("yaml");
    expect(getExtensionLanguageKey("xml")).toBe("xml");
    expect(getExtensionLanguageKey("html")).toBe("html");
    expect(getExtensionLanguageKey("htm")).toBe("html");
    expect(getExtensionLanguageKey("java")).toBe("java");
    expect(getExtensionLanguageKey("sql")).toBe("sql");
    expect(getExtensionLanguageKey("txt")).toBe("text");
  });
});
