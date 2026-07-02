export interface ObsidianVaultConfigWriter {
  setConfig?: (key: string, value: unknown) => void;
}

export function enableUnsupportedFileVisibility(vault: ObsidianVaultConfigWriter): void {
  try {
    vault.setConfig?.("showUnsupportedFiles", true);
  } catch (error) {
    console.warn("Text File Editor：无法自动打开 Obsidian 的“检测所有文件扩展名”设置。", error);
  }
}
