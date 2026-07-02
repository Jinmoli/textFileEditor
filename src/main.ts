import { Notice, Plugin, TFile } from "obsidian";
import { isSupportedExtension } from "./extension-map";
import { registerTextFileExtensions } from "./extension-registration";
import { enableUnsupportedFileVisibility } from "./obsidian-config";
import {
  DEFAULT_SETTINGS,
  TextFileEditorSettingTab,
  type TextFileEditorSettings,
  mergeSettings
} from "./settings";
import { TEXT_FILE_EDITOR_VIEW_TYPE, TextFileEditorView } from "./editor-view";
import { TEXT_FILE_LIST_VIEW_TYPE, TextFileListView } from "./text-file-list-view";

export default class TextFileEditorPlugin extends Plugin {
  settings: TextFileEditorSettings = DEFAULT_SETTINGS;
  private registeredExtensions: string[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();

    enableUnsupportedFileVisibility(this.app.vault as unknown as { setConfig?: (key: string, value: unknown) => void });

    this.registerView(TEXT_FILE_EDITOR_VIEW_TYPE, (leaf) => new TextFileEditorView(leaf, () => this.settings));
    this.registerView(TEXT_FILE_LIST_VIEW_TYPE, (leaf) => new TextFileListView(leaf, () => this.settings));

    this.refreshRegisteredExtensions();
    this.addSettingTab(new TextFileEditorSettingTab(this.app, this));

    this.addRibbonIcon("file-text", "打开文本文件列表", () => {
      void this.activateTextFileListView();
    });

    this.addCommand({
      id: "open-text-file-list",
      name: "打开文本文件列表",
      callback: () => {
        void this.activateTextFileListView();
      }
    });

    this.addCommand({
      id: "save-current-text-file",
      name: "保存当前文本文件",
      callback: () => {
        void this.getActiveTextFileView()?.save();
      }
    });

    this.addCommand({
      id: "reload-current-text-file",
      name: "重新加载当前文本文件",
      callback: () => {
        void this.getActiveTextFileView()?.reload();
      }
    });

    this.addCommand({
      id: "toggle-current-text-file-word-wrap",
      name: "切换当前文本文件自动换行",
      callback: () => {
        this.getActiveTextFileView()?.toggleWordWrap();
      }
    });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(TEXT_FILE_EDITOR_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(TEXT_FILE_LIST_VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    this.settings = mergeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  refreshRegisteredExtensions(): void {
    const result = registerTextFileExtensions({
      requestedExtensions: this.settings.supportedExtensions,
      viewType: TEXT_FILE_EDITOR_VIEW_TYPE,
      registerExtension: (extension, viewType) => {
        this.registerExtensions([extension], viewType);
      }
    });

    this.registeredExtensions = result.registeredExtensions;
  }

  supportsFile(file: TFile): boolean {
    return isSupportedExtension(file.extension, this.registeredExtensions);
  }

  private async activateTextFileListView(): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(TEXT_FILE_LIST_VIEW_TYPE)[0];
    if (existingLeaf) {
      await this.app.workspace.revealLeaf(existingLeaf);
      return;
    }

    const leaf = this.app.workspace.getLeftLeaf(false);
    if (!leaf) {
      new Notice("无法打开文本文件列表，请确认左侧边栏可用。");
      return;
    }

    await leaf.setViewState({
      type: TEXT_FILE_LIST_VIEW_TYPE,
      active: true
    });
    await this.app.workspace.revealLeaf(leaf);
  }

  private getActiveTextFileView(): TextFileEditorView | null {
    const view = this.app.workspace.getActiveViewOfType(TextFileEditorView);
    if (!view) {
      new Notice("当前没有打开的文本文件编辑视图。");
      return null;
    }
    return view;
  }
}
