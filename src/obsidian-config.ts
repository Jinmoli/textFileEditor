export interface ObsidianVaultConfigWriter {
  setConfig?: (key: string, value: unknown) => void;
}

interface RefreshableExplorerView {
  requestSort?: () => void;
  refresh?: () => void;
  reload?: () => void;
  onFileTreeChanged?: () => void;
  onOpen?: () => void;
  tree?: {
    reload?: () => void;
    requestSort?: () => void;
  };
}

interface ObsidianWorkspaceLike {
  getLeavesOfType?: (type: string) => Array<{ view?: unknown }>;
}

export interface UnsupportedFileVisibilityContext {
  vault: ObsidianVaultConfigWriter;
  workspace?: ObsidianWorkspaceLike;
}

export function enableUnsupportedFileVisibility(context: UnsupportedFileVisibilityContext): void {
  try {
    context.vault.setConfig?.("showUnsupportedFiles", true);
  } catch (error) {
    console.warn("Text File Editor：无法自动打开 Obsidian 的“检测所有文件扩展名”设置。", error);
  }

  try {
    refreshUnsupportedFileViews(context.workspace);
  } catch (error) {
    console.warn("Text File Editor：已打开显示设置，但刷新文件列表失败，可手动重载 Obsidian。", error);
  }
}

function refreshUnsupportedFileViews(workspace?: ObsidianWorkspaceLike): void {
  const leaves = workspace?.getLeavesOfType?.("file-explorer") ?? [];

  for (const leaf of leaves) {
    const view = leaf.view as RefreshableExplorerView | undefined;
    view?.requestSort?.();
    view?.refresh?.();
    view?.reload?.();
    view?.onFileTreeChanged?.();
    view?.onOpen?.();
    view?.tree?.requestSort?.();
    view?.tree?.reload?.();
  }
}
