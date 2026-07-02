export type LanguageKey =
  | "css"
  | "dockerfile"
  | "html"
  | "java"
  | "javascript"
  | "json"
  | "properties"
  | "powershell"
  | "shell"
  | "sql"
  | "text"
  | "toml"
  | "xml"
  | "yaml";

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
  "java",
  "conf",
  "ini",
  "env",
  "sh",
  "bash",
  "zsh",
  "bat",
  "cmd",
  "ps1",
  "toml",
  "dockerfile",
  "js",
  "mjs",
  "cjs",
  "ts",
  "css"
] as const;

const LANGUAGE_BY_EXTENSION: Record<string, LanguageKey> = {
  bash: "shell",
  bat: "shell",
  cjs: "javascript",
  cmd: "shell",
  css: "css",
  dockerfile: "dockerfile",
  env: "properties",
  htm: "html",
  html: "html",
  ini: "properties",
  java: "java",
  js: "javascript",
  json: "json",
  mjs: "javascript",
  properties: "properties",
  ps1: "powershell",
  sh: "shell",
  sql: "sql",
  toml: "toml",
  ts: "javascript",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  zsh: "shell"
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
