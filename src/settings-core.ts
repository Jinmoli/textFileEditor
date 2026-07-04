import { DEFAULT_SUPPORTED_EXTENSIONS, normalizeExtensionList } from "./extension-map";
import { normalizeEncodingInput, type TextFileEncoding } from "./text-encoding";

export interface TextFileEditorSettings {
  autoOpenFileList: boolean;
  autoSaveDraftIntervalSeconds: number;
  defaultReadOnly: boolean;
  defaultWordWrap: boolean;
  encoding: TextFileEncoding;
  largeFileWarningSizeMb: number;
  saveShortcutHint: string;
  showLineNumbers: boolean;
  supportedExtensions: string[];
}

export const DEFAULT_SETTINGS: TextFileEditorSettings = {
  autoOpenFileList: false,
  autoSaveDraftIntervalSeconds: 30,
  defaultReadOnly: false,
  defaultWordWrap: true,
  encoding: "auto",
  largeFileWarningSizeMb: 5,
  saveShortcutHint: "Ctrl/Cmd+S",
  showLineNumbers: true,
  supportedExtensions: [...DEFAULT_SUPPORTED_EXTENSIONS]
};

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function parseExtensionInput(input: string): string[] {
  return normalizeExtensionList(input.split(/[,\s]+/));
}

export function validateSupportedExtensions(extensions: readonly string[]): ValidationResult {
  const normalized = normalizeExtensionList(extensions);

  if (normalized.length === 0) {
    return { ok: false, message: "请至少保留一个可打开的文件扩展名。" };
  }

  for (const extension of extensions) {
    const trimmed = extension.trim();
    if (/[\\/]/.test(trimmed)) {
      return { ok: false, message: `扩展名“${trimmed}”不能包含路径分隔符。` };
    }
  }

  return { ok: true };
}

export function normalizePositiveNumber(value: unknown, fallback: number): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return fallback;
  }
  return numberValue;
}

export function mergeSettings(saved: Partial<TextFileEditorSettings> | null | undefined): TextFileEditorSettings {
  const supportedExtensions = normalizeExtensionList(
    saved?.supportedExtensions?.length
      ? [...saved.supportedExtensions, ...DEFAULT_SETTINGS.supportedExtensions]
      : DEFAULT_SETTINGS.supportedExtensions
  );

  return {
    autoOpenFileList: saved?.autoOpenFileList ?? DEFAULT_SETTINGS.autoOpenFileList,
    autoSaveDraftIntervalSeconds: normalizePositiveNumber(
      saved?.autoSaveDraftIntervalSeconds,
      DEFAULT_SETTINGS.autoSaveDraftIntervalSeconds
    ),
    defaultReadOnly: saved?.defaultReadOnly ?? DEFAULT_SETTINGS.defaultReadOnly,
    defaultWordWrap: saved?.defaultWordWrap ?? DEFAULT_SETTINGS.defaultWordWrap,
    encoding: normalizeEncodingInput(saved?.encoding),
    largeFileWarningSizeMb: normalizePositiveNumber(saved?.largeFileWarningSizeMb, DEFAULT_SETTINGS.largeFileWarningSizeMb),
    saveShortcutHint: saved?.saveShortcutHint?.trim() || DEFAULT_SETTINGS.saveShortcutHint,
    showLineNumbers: saved?.showLineNumbers ?? DEFAULT_SETTINGS.showLineNumbers,
    supportedExtensions
  };
}
