import { describe, expect, it } from "vitest";
import {
  buildOriginalFileSnapshot,
  buildSaveRiskSummary,
  normalizeLineEndingsForStorage,
  resolveWriteEncoding,
  shouldNoticeSpecialLineEnding
} from "./file-fidelity";

describe("file fidelity helpers", () => {
  it("detects crlf line endings from loaded content", () => {
    const snapshot = buildOriginalFileSnapshot({
      content: "a\r\nb\r\n",
      encoding: "utf-8",
      fileType: "text"
    });

    expect(snapshot.lineEnding).toBe("crlf");
  });

  it("detects lf line endings from loaded content", () => {
    const snapshot = buildOriginalFileSnapshot({
      content: "a\nb\n",
      encoding: "utf-8",
      fileType: "text"
    });

    expect(snapshot.lineEnding).toBe("lf");
  });

  it("detects mixed line endings from loaded content", () => {
    const snapshot = buildOriginalFileSnapshot({
      content: "a\r\nb\n",
      encoding: "utf-8",
      fileType: "text"
    });

    expect(snapshot.lineEnding).toBe("mixed");
  });

  it("restores crlf output before save", () => {
    expect(normalizeLineEndingsForStorage("a\nb\n", "crlf")).toBe("a\r\nb\r\n");
  });

  it("keeps mixed line endings unchanged before save", () => {
    expect(normalizeLineEndingsForStorage("a\r\nb\n", "mixed")).toBe("a\r\nb\n");
  });

  it("reapplies the original mixed line-ending sequence when line count is unchanged", () => {
    const snapshot = buildOriginalFileSnapshot({
      content: "a\r\nb\nc\r\n",
      encoding: "utf-8",
      fileType: "text"
    });

    expect(normalizeLineEndingsForStorage("a\nb\nc\n", snapshot.lineEnding, snapshot.lineEndingSequence)).toBe("a\r\nb\nc\r\n");
  });

  it("flags encoding changes as a high-risk save operation", () => {
    const summary = buildSaveRiskSummary({
      originalEncoding: "gbk",
      nextEncoding: "utf-8",
      originalLineEnding: "crlf",
      nextLineEnding: "crlf",
      usesDisplayStorageTransform: false
    });

    expect(summary.hasRisk).toBe(true);
    expect(summary.messages).toContain("原始编码为 GBK，继续保存将写成 UTF-8。");
  });

  it("flags properties display/storage transforms as a visible save warning", () => {
    const summary = buildSaveRiskSummary({
      originalEncoding: "utf-8",
      nextEncoding: "utf-8",
      originalLineEnding: "lf",
      nextLineEnding: "lf",
      usesDisplayStorageTransform: true
    });

    expect(summary.hasRisk).toBe(false);
    expect(summary.messages).toContain("当前文件会在保存时自动转换为兼容的 properties 存储格式。");
  });

  it("flags line ending changes as a visible save warning", () => {
    const summary = buildSaveRiskSummary({
      originalEncoding: "utf-8",
      nextEncoding: "utf-8",
      originalLineEnding: "crlf",
      nextLineEnding: "lf",
      usesDisplayStorageTransform: false
    });

    expect(summary.messages).toContain("原始换行为 CRLF，继续保存将改为 LF。");
  });

  it("falls back to utf-8 when ascii content now contains non-ascii characters", () => {
    expect(resolveWriteEncoding("ascii", "title=测试")).toBe("utf-8");
  });

  it("keeps utf-16le when the original file was utf-16le", () => {
    expect(resolveWriteEncoding("utf-16le", "title=测试")).toBe("utf-16le");
  });

  it("keeps gbk when the original file was gbk", () => {
    expect(resolveWriteEncoding("gbk", "title=中文")).toBe("gbk");
  });

  it("only surfaces line-ending notices for mixed files", () => {
    expect(shouldNoticeSpecialLineEnding("mixed")).toBe(true);
    expect(shouldNoticeSpecialLineEnding("unknown")).toBe(false);
    expect(shouldNoticeSpecialLineEnding("lf")).toBe(false);
  });
});
