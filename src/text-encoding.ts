export type TextFileEncoding = "auto" | "ascii" | "utf-8" | "gbk" | "gb18030" | "big5" | "shift_jis" | "utf-16le" | "utf-16be";

export interface DecodedTextContent {
  content: string;
  encoding: TextFileEncoding;
}

const DECODABLE_ENCODINGS: Exclude<TextFileEncoding, "auto">[] = [
  "ascii",
  "utf-8",
  "gbk",
  "gb18030",
  "big5",
  "shift_jis",
  "utf-16le",
  "utf-16be"
];

export function decodeTextContent(buffer: ArrayBuffer, preferredEncoding: TextFileEncoding): DecodedTextContent {
  if (preferredEncoding !== "auto") {
    return {
      content: decodeWithEncoding(buffer, preferredEncoding),
      encoding: preferredEncoding
    };
  }

  const bomEncoding = detectBomEncoding(buffer);
  if (bomEncoding) {
    return {
      content: decodeWithEncoding(buffer, bomEncoding),
      encoding: bomEncoding
    };
  }

  const decoded = DECODABLE_ENCODINGS.map((encoding) => ({
    encoding,
    content: decodeWithEncoding(buffer, encoding)
  }));
  decoded.sort((left, right) => replacementScore(left.content) - replacementScore(right.content));
  return decoded[0];
}

export function normalizeEncodingInput(value: string | null | undefined): TextFileEncoding {
  const normalized = (value ?? "").trim().toLowerCase().replace("_", "-");
  if (normalized === "us-ascii" || normalized === "ansi-x3.4-1968") {
    return "ascii";
  }
  if (normalized === "utf8") {
    return "utf-8";
  }
  if (normalized === "utf16le") {
    return "utf-16le";
  }
  if (normalized === "utf16be") {
    return "utf-16be";
  }
  return isTextFileEncoding(normalized) ? normalized : "auto";
}

function isTextFileEncoding(value: string): value is TextFileEncoding {
  return value === "auto" || DECODABLE_ENCODINGS.includes(value as Exclude<TextFileEncoding, "auto">);
}

function decodeWithEncoding(buffer: ArrayBuffer, encoding: Exclude<TextFileEncoding, "auto">): string {
  return new TextDecoder(encoding, { fatal: false }).decode(buffer);
}

function detectBomEncoding(buffer: ArrayBuffer): Exclude<TextFileEncoding, "auto"> | null {
  const bytes = new Uint8Array(buffer.slice(0, 3));
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "utf-8";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return "utf-16le";
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return "utf-16be";
  }
  return null;
}

function replacementScore(content: string): number {
  const replacements = content.match(/\uFFFD/g)?.length ?? 0;
  const controls = content.match(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g)?.length ?? 0;
  return replacements * 10 + controls;
}
