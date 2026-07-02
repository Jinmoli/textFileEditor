import { DEFAULT_SUPPORTED_EXTENSIONS, normalizeExtensionList } from "./extension-map";

export interface TextFileEditorSettings {
  defaultReadOnly: boolean;
  defaultWordWrap: boolean;
  saveShortcutHint: string;
  supportedExtensions: string[];
}

export const DEFAULT_SETTINGS: TextFileEditorSettings = {
  defaultReadOnly: false,
  defaultWordWrap: true,
  saveShortcutHint: "Ctrl/Cmd+S",
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

export function mergeSettings(saved: Partial<TextFileEditorSettings> | null | undefined): TextFileEditorSettings {
  const supportedExtensions = normalizeExtensionList(
    saved?.supportedExtensions?.length ? saved.supportedExtensions : DEFAULT_SETTINGS.supportedExtensions
  );

  return {
    defaultReadOnly: saved?.defaultReadOnly ?? DEFAULT_SETTINGS.defaultReadOnly,
    defaultWordWrap: saved?.defaultWordWrap ?? DEFAULT_SETTINGS.defaultWordWrap,
    saveShortcutHint: saved?.saveShortcutHint?.trim() || DEFAULT_SETTINGS.saveShortcutHint,
    supportedExtensions
  };
}
