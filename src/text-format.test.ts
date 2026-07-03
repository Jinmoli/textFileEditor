import { describe, expect, it } from "vitest";
import { formatTextContent, isFormattingSupported } from "./text-format";

describe("text formatting helpers", () => {
  it("formats json content with indentation", () => {
    const result = formatTextContent('{"name":"中文","items":[1,2]}', "json");

    expect(result.content).toBe('{\n  "name": "中文",\n  "items": [\n    1,\n    2\n  ]\n}');
  });

  it("formats xml content into multiple lines", () => {
    const result = formatTextContent("<root><item>1</item><item>2</item></root>", "xml");

    expect(result.content).toBe("<root>\n  <item>1</item>\n  <item>2</item>\n</root>");
  });

  it("formats simple yaml content with nested indentation", () => {
    const result = formatTextContent("root:\n  child: 1\n  list:\n  - a\n  - b", "yaml");

    expect(result.content).toBe("root:\n  child: 1\n  list:\n    - a\n    - b");
  });

  it("formats sql content with line breaks", () => {
    const result = formatTextContent("select id,name from users where status=1 order by created_at desc", "sql");

    expect(result.content).toBe("SELECT id, name\nFROM users\nWHERE status = 1\nORDER BY created_at DESC");
  });

  it("rejects unsupported language keys", () => {
    expect(isFormattingSupported("javascript")).toBe(false);
    expect(() => formatTextContent("const x = 1;", "javascript")).toThrow("当前文件类型暂不支持格式化。");
  });

  it("surfaces parse failures with user-friendly messages", () => {
    expect(() => formatTextContent('{"name":', "json")).toThrow("格式化失败，请先确认当前文件语法完整。");
  });
});
