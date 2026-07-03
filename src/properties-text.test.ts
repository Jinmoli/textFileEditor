import { describe, expect, it } from "vitest";
import { decodePropertiesTextForDisplay, encodePropertiesTextForStorage } from "./properties-text";

describe("properties text helpers", () => {
  it("decodes java unicode escapes for display", () => {
    expect(decodePropertiesTextForDisplay("## \\u6D4B\\u8BD5")).toBe("## 测试");
  });

  it("decodes common escaped whitespace characters", () => {
    expect(decodePropertiesTextForDisplay("line1\\nline2\\tvalue")).toBe("line1\nline2\tvalue");
  });

  it("encodes non-ascii characters back to java unicode escapes", () => {
    expect(encodePropertiesTextForStorage("## 测试")).toBe("## \\u6D4B\\u8BD5");
  });

  it("keeps ascii content readable while escaping control characters", () => {
    expect(encodePropertiesTextForStorage("line1\nline2\tvalue")).toBe("line1\\nline2\\tvalue");
  });
});
