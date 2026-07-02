import { normalizeExtensionList } from "./extension-map";

export interface RegisterTextFileExtensionsOptions {
  requestedExtensions: readonly string[];
  viewType: string;
  registerExtension: (extension: string, viewType: string) => void;
  warn?: (message: string, error: unknown) => void;
}

export interface RegisterTextFileExtensionsResult {
  registeredExtensions: string[];
  skippedExtensions: string[];
}

export function registerTextFileExtensions(
  options: RegisterTextFileExtensionsOptions
): RegisterTextFileExtensionsResult {
  const requestedExtensions = normalizeExtensionList(options.requestedExtensions);
  const registeredExtensions: string[] = [];
  const skippedExtensions: string[] = [];
  const warn = options.warn ?? console.warn;

  for (const extension of requestedExtensions) {
    try {
      options.registerExtension(extension, options.viewType);
      registeredExtensions.push(extension);
    } catch (error) {
      skippedExtensions.push(extension);
      warn(`Text File Editor：扩展名 .${extension} 注册失败，可能已被 Obsidian 或其他插件占用。`, error);
    }
  }

  return { registeredExtensions, skippedExtensions };
}
