export type FormattableLanguage = "json" | "sql" | "xml" | "yaml";

export interface FormattedTextContent {
  content: string;
}

const SQL_KEYWORDS = [
  "ORDER BY",
  "GROUP BY",
  "LEFT JOIN",
  "RIGHT JOIN",
  "INNER JOIN",
  "OUTER JOIN",
  "INSERT INTO",
  "SELECT",
  "FROM",
  "WHERE",
  "HAVING",
  "VALUES",
  "UPDATE",
  "DELETE",
  "LIMIT",
  "JOIN",
  "ON",
  "SET",
  "AND",
  "OR",
  "ASC",
  "DESC"
] as const;

export function isFormattingSupported(language: string): language is FormattableLanguage {
  return language === "json" || language === "sql" || language === "xml" || language === "yaml";
}

export function formatTextContent(content: string, language: string): FormattedTextContent {
  if (!isFormattingSupported(language)) {
    throw new Error("当前文件类型暂不支持格式化。");
  }

  try {
    return {
      content: formatByLanguage(content, language)
    };
  } catch (error) {
    if (error instanceof Error && error.message === "当前文件类型暂不支持格式化。") {
      throw error;
    }
    throw new Error("格式化失败，请先确认当前文件语法完整。");
  }
}

function formatByLanguage(content: string, language: FormattableLanguage): string {
  switch (language) {
    case "json":
      return `${JSON.stringify(JSON.parse(content), null, 2)}\n`.trimEnd();
    case "xml":
      return formatXml(content);
    case "yaml":
      return formatYaml(content);
    case "sql":
      return formatSql(content);
  }
}

function formatXml(content: string): string {
  const normalized = content.trim().replace(/>\s+</g, "><").replace(/(>)(<)(\/*)/g, "$1\n$2$3");
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const formatted: string[] = [];
  let indentLevel = 0;

  for (const line of lines) {
    if (line.startsWith("</")) {
      indentLevel = Math.max(indentLevel - 1, 0);
    }

    formatted.push(`${"  ".repeat(indentLevel)}${line}`);

    if (isXmlContainerOpen(line)) {
      indentLevel += 1;
    }
  }

  return formatted.join("\n");
}

function isXmlContainerOpen(line: string): boolean {
  if (line.startsWith("<?") || line.startsWith("<!") || line.startsWith("</")) {
    return false;
  }
  if (line.endsWith("/>")) {
    return false;
  }
  return /^<[^/][^>]*>$/.test(line);
}

function formatYaml(content: string): string {
  const lines = normalizeLines(content);
  const formatted: string[] = [];
  const containerStack: number[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      formatted.push("");
      continue;
    }

    const sourceIndent = countLeadingSpaces(rawLine);
    while (containerStack.length > 0 && sourceIndent <= containerStack[containerStack.length - 1]) {
      containerStack.pop();
    }

    let indentLevel = containerStack.length;
    if (trimmed.startsWith("- ")) {
      indentLevel = containerStack.length + (containerStack.length > 0 ? 1 : 0);
    }

    formatted.push(`${"  ".repeat(indentLevel)}${trimmed}`);

    if (trimmed.endsWith(":") && !trimmed.startsWith("- ")) {
      containerStack.push(sourceIndent);
    }
  }

  return formatted.join("\n").trimEnd();
}

function formatSql(content: string): string {
  let normalized = content.replace(/\s+/g, " ").trim();
  normalized = normalized.replace(/\s*,\s*/g, ", ");
  normalized = normalized.replace(/\s*=\s*/g, " = ");

  for (const keyword of SQL_KEYWORDS) {
    const pattern = keyword.replace(/\s+/g, "\\s+");
    normalized = normalized.replace(new RegExp(`\\b${pattern}\\b`, "gi"), keyword);
  }

  const majorBreakKeywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "VALUES",
    "SET",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "JOIN",
    "ON"
  ];

  for (const keyword of majorBreakKeywords) {
    const pattern = keyword.replace(/\s+/g, "\\s+");
    normalized = normalized.replace(new RegExp(`\\s*\\b${pattern}\\b`, "g"), `\n${keyword}`);
  }

  normalized = normalized.replace(/\s+AND\b/g, "\n  AND");
  normalized = normalized.replace(/\s+OR\b/g, "\n  OR");

  return normalizeLines(normalized)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function normalizeLines(content: string): string[] {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function countLeadingSpaces(value: string): number {
  const match = value.match(/^\s*/);
  return match?.[0].length ?? 0;
}
