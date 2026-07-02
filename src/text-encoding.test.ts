import { describe, expect, it } from "vitest";
import { decodeTextContent, normalizeEncodingInput } from "./text-encoding";

describe("text encoding helpers", () => {
  it("normalizes encoding setting values", () => {
    expect(normalizeEncodingInput("UTF8")).toBe("utf-8");
    expect(normalizeEncodingInput("utf16le")).toBe("utf-16le");
    expect(normalizeEncodingInput("gbk")).toBe("gbk");
    expect(normalizeEncodingInput("unknown")).toBe("auto");
  });

  it("decodes preferred utf-8 content", () => {
    const buffer = new TextEncoder().encode("hello").buffer;
    expect(decodeTextContent(buffer, "utf-8")).toEqual({ content: "hello", encoding: "utf-8" });
  });

  it("uses bom to detect utf-16le content in auto mode", () => {
    const buffer = new Uint8Array([0xff, 0xfe, 0x41, 0x00]).buffer;
    expect(decodeTextContent(buffer, "auto")).toEqual({ content: "A", encoding: "utf-16le" });
  });
});
