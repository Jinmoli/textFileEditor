import type { TextFileEncoding } from "./text-encoding";

export type StoredFileType = "text" | "properties";
export type LineEndingStyle = "lf" | "crlf" | "mixed" | "unknown";
export type LineEndingToken = "\r\n" | "\n" | "\r";

export interface OriginalFileSnapshot {
  encoding: TextFileEncoding;
  fileType: StoredFileType;
  lineEnding: LineEndingStyle;
  lineEndingSequence: LineEndingToken[];
}

export interface SaveRiskSummary {
  hasRisk: boolean;
  messages: string[];
}

export function buildOriginalFileSnapshot(input: {
  content: string;
  encoding: TextFileEncoding;
  fileType: StoredFileType;
}): OriginalFileSnapshot {
  return {
    encoding: input.encoding,
    fileType: input.fileType,
    lineEnding: detectLineEnding(input.content),
    lineEndingSequence: extractLineEndingSequence(input.content)
  };
}

export function detectLineEnding(content: string): LineEndingStyle {
  const hasCrLf = content.includes("\r\n");
  const hasStandaloneLf = content.replace(/\r\n/g, "").includes("\n");

  if (hasCrLf && hasStandaloneLf) {
    return "mixed";
  }

  if (hasCrLf) {
    return "crlf";
  }
  if (content.includes("\n")) {
    return "lf";
  }
  return "unknown";
}

export function normalizeLineEndingsForStorage(
  content: string,
  lineEnding: LineEndingStyle,
  originalSequence: LineEndingToken[] = []
): string {
  if (lineEnding === "crlf") {
    return content.replace(/\r\n|\r|\n/g, "\r\n");
  }

  if (lineEnding === "lf") {
    return content.replace(/\r\n|\r/g, "\n");
  }

  if (lineEnding === "mixed") {
    return reapplyMixedLineEndings(content, originalSequence);
  }

  return content;
}

export function buildSaveRiskSummary(input: {
  originalEncoding: TextFileEncoding;
  nextEncoding: TextFileEncoding;
  originalLineEnding: LineEndingStyle;
  nextLineEnding: LineEndingStyle;
  usesDisplayStorageTransform: boolean;
}): SaveRiskSummary {
  const messages: string[] = [];
  let hasRisk = false;

  if (input.originalEncoding !== input.nextEncoding) {
    messages.push(`原始编码为 ${input.originalEncoding.toUpperCase()}，继续保存将写成 ${input.nextEncoding.toUpperCase()}。`);
    hasRisk = true;
  }

  if (input.originalLineEnding !== "unknown" && input.originalLineEnding !== input.nextLineEnding) {
    messages.push(`原始换行为 ${input.originalLineEnding.toUpperCase()}，继续保存将改为 ${input.nextLineEnding.toUpperCase()}。`);
    hasRisk = true;
  }

  if (input.usesDisplayStorageTransform) {
    messages.push("当前文件会在保存时自动转换为兼容的 properties 存储格式。");
  }

  return {
    hasRisk,
    messages
  };
}

export function resolveWriteEncoding(originalEncoding: TextFileEncoding, content: string): TextFileEncoding {
  if (originalEncoding === "auto") {
    return "utf-8";
  }

  if (originalEncoding !== "ascii") {
    return originalEncoding;
  }

  return /^[\u0000-\u007f]*$/.test(content) ? "ascii" : "utf-8";
}

export function shouldNoticeSpecialLineEnding(lineEnding: LineEndingStyle): boolean {
  return lineEnding === "mixed";
}

export function extractLineEndingSequence(content: string): LineEndingToken[] {
  const matches = content.match(/\r\n|\n|\r/g);
  return (matches ?? []) as LineEndingToken[];
}

function reapplyMixedLineEndings(content: string, originalSequence: LineEndingToken[]): string {
  if (originalSequence.length === 0) {
    return content;
  }

  const normalized = content.replace(/\r\n|\r/g, "\n");
  const lines = normalized.split("\n");
  if (lines.length === 1) {
    return content;
  }

  const fallbackSeparator = detectDominantSeparator(originalSequence);
  let result = lines[0];

  for (let index = 1; index < lines.length; index += 1) {
    const separator = originalSequence[index - 1] ?? fallbackSeparator;
    result += `${separator}${lines[index]}`;
  }

  return result;
}

function detectDominantSeparator(sequence: LineEndingToken[]): LineEndingToken {
  let crlfCount = 0;
  let lfCount = 0;
  let crCount = 0;

  for (const separator of sequence) {
    if (separator === "\r\n") {
      crlfCount += 1;
    } else if (separator === "\n") {
      lfCount += 1;
    } else {
      crCount += 1;
    }
  }

  if (crlfCount >= lfCount && crlfCount >= crCount) {
    return "\r\n";
  }
  if (lfCount >= crCount) {
    return "\n";
  }
  return "\r";
}
