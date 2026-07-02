import { Notice, Plugin, TFile } from "obsidian";
import { isSupportedExtension, normalizeExtensionList } from "./extension-map";
import {
  DEFAULT_SETTINGS,
  TextFileEditorSettingTab,
  type TextFileEditorSettings,
  mergeSettings
} from "./settings";
import { TEXT_FILE_EDITOR_VIEW_TYPE, TextFileEditorView } from "./editor-view";

export default class TextFileEditorPlugin extends Plugin {
  settings: TextFileEditorSettings = DEFAULT_SETTINGS;
  private registeredExtensions: string[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(TEXT_FILE_EDITOR_VIEW_TYPE, (leaf) => new TextFileEditorView(leaf, () => this.settings));

    this.refreshRegisteredExtensions();
    this.addSettingTab(new TextFileEditorSettingTab(this.app, this));

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
  }

  async loadSettings(): Promise<void> {
    this.settings = mergeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  refreshRegisteredExtensions(): void {
    this.registeredExtensions = normalizeExtensionList(this.settings.supportedExtensions);

    for (const extension of this.registeredExtensions) {
      this.registerExtensions([extension], TEXT_FILE_EDITOR_VIEW_TYPE);
    }
  }

  supportsFile(file: TFile): boolean {
    return isSupportedExtension(file.extension, this.registeredExtensions);
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
