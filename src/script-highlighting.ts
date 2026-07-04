import { StreamParser, StringStream } from "@codemirror/language";

export interface HighlightTokenSample {
  text: string;
  style: string | null;
}

export type ScriptLanguageKey = "shell" | "batch";

const SHELL_KEYWORDS = new Set([
  "case",
  "do",
  "done",
  "elif",
  "else",
  "esac",
  "export",
  "fi",
  "for",
  "function",
  "if",
  "in",
  "local",
  "read",
  "return",
  "select",
  "set",
  "shift",
  "then",
  "trap",
  "unset",
  "until",
  "while"
]);

const BATCH_KEYWORDS = new Set([
  "call",
  "cd",
  "choice",
  "copy",
  "defined",
  "del",
  "do",
  "echo",
  "else",
  "endlocal",
  "errorlevel",
  "exist",
  "exit",
  "for",
  "goto",
  "if",
  "in",
  "md",
  "move",
  "not",
  "pause",
  "popd",
  "pushd",
  "rd",
  "rem",
  "ren",
  "set",
  "setlocal",
  "shift",
  "start"
]);

export function collectStreamTokens(language: ScriptLanguageKey, line: string): HighlightTokenSample[] {
  const stream = new StringStream(line, 4, 2);
  const tokenize = language === "shell" ? tokenizeShell : tokenizeBatch;
  const tokens: HighlightTokenSample[] = [];

  while (!stream.eol()) {
    stream.start = stream.pos;
    const style = tokenize(stream);
    const text = stream.current();
    if (text && text.trim().length > 0) {
      tokens.push({ text, style });
    }
  }

  return tokens;
}

export function tokenizeShell(stream: StringStream): string | null {
  if (stream.eatSpace()) {
    return null;
  }
  if (stream.match(/^#.*/)) {
    return "comment";
  }
  if (stream.match(/^"(?:[^"\\]|\\.)*"?/) || stream.match(/^'(?:[^']*)'?/)) {
    return "string";
  }
  if (stream.match(/^\$\([^)]*\)/)) {
    return "string-2";
  }
  if (stream.match(/^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/) || stream.match(/^\$[0-9@#?*!-]/)) {
    return "variableName";
  }
  if (stream.match(/^\[\[/) || stream.match(/^\]\]/)) {
    return "keyword";
  }
  if (stream.match(/^\b\d+(?:\.\d+)?\b/)) {
    return "number";
  }
  if (stream.match(/^(?:&&|\|\||>>|<<|[|&;<>]=?|[\[\](){}])/)) {
    return "operator";
  }

  const functionName = stream.match(/^[A-Za-z_][A-Za-z0-9_-]*(?=\s*\(\s*\))/);
  if (functionName && functionName !== true) {
    return "def";
  }

  const keywordFunctionName = stream.match(/^[A-Za-z_][A-Za-z0-9_-]*/, false);
  if (
    keywordFunctionName &&
    keywordFunctionName !== true &&
    stream.string.slice(0, stream.start).trimEnd().endsWith("function")
  ) {
    stream.match(/^[A-Za-z_][A-Za-z0-9_-]*/);
    return "def";
  }

  const word = stream.match(/^[A-Za-z_][A-Za-z0-9_-]*/);
  if (word && word !== true) {
    return SHELL_KEYWORDS.has(word[0]) ? "keyword" : null;
  }

  stream.next();
  return null;
}

export function tokenizeBatch(stream: StringStream): string | null {
  if (stream.eatSpace()) {
    return null;
  }
  if (stream.match(/^::.*$/) || stream.match(/^rem\b.*$/i)) {
    return "comment";
  }
  if (stream.match(/^:[A-Za-z0-9_.-]+/)) {
    return "def";
  }
  if (stream.match(/^"(?:[^"]|"")*"?/)) {
    return "string";
  }
  if (
    stream.match(/^%[^%\s]+%/) ||
    stream.match(/^%%?[A-Za-z0-9_]+/) ||
    stream.match(/^%~[A-Za-z0-9]+/i) ||
    stream.match(/^![^!\s]+!/)
  ) {
    return "variableName";
  }
  if (stream.match(/^\b\d+\b/)) {
    return "number";
  }
  if (stream.match(/^\/[Aa]\b/) && stream.string.slice(0, stream.start).trimEnd().endsWith("set")) {
    return "keyword";
  }
  if (stream.match(/^(?:&&|\|\||>>|<<|[|&<>]=?|[()])/)) {
    return "operator";
  }

  const word = stream.match(/^[A-Za-z_][A-Za-z0-9_-]*/);
  if (word && word !== true) {
    return BATCH_KEYWORDS.has(word[0].toLowerCase()) ? "keyword" : null;
  }

  stream.next();
  return null;
}

export const shellParser: StreamParser<null> = {
  name: "shell",
  token(stream) {
    return tokenizeShell(stream);
  }
};

export const batchParser: StreamParser<null> = {
  name: "batch",
  token(stream) {
    return tokenizeBatch(stream);
  }
};
