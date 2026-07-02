export type LanguageKey = "html" | "json" | "sql" | "text" | "xml" | "yaml";

export const DEFAULT_SUPPORTED_EXTENSIONS = [
  "txt",
  "sql",
  "json",
  "log",
  "config",
  "yml",
  "yaml",
  "properties",
  "xml",
  "html",
  "htm",
  "conf",
  "ini"
] as const;

const LANGUAGE_BY_EXTENSION: Record<string, LanguageKey> = {
  htm: "html",
  html: "html",
  json: "json",
  sql: "sql",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml"
};

export function normalizeExtension(extension: string): string {
  return extension.trim().replace(/^\.+/, "").toLowerCase();
}

export function normalizeExtensionList(extensions: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const extension of extensions) {
    const value = normalizeExtension(extension);
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export function isSupportedExtension(extension: string, supportedExtensions: readonly string[]): boolean {
  const normalized = normalizeExtension(extension);
  return normalizeExtensionList(supportedExtensions).includes(normalized);
}

export function getExtensionLanguageKey(extension: string): LanguageKey {
  const normalized = normalizeExtension(extension);
  return LANGUAGE_BY_EXTENSION[normalized] ?? "text";
}
