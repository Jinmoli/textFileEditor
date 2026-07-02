import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { TEXT_FILE_EDITOR_VIEW_TYPE } from "./editor-view";
import { scanSupportedTextFiles, type TextFileListItem } from "./text-file-list-core";
import type { TextFileEditorSettings } from "./settings-core";

export const TEXT_FILE_LIST_VIEW_TYPE = "text-file-editor-list-view";

export class TextFileListView extends ItemView {
  constructor(
    leaf: WorkspaceLeaf,
    private readonly settingsProvider: () => TextFileEditorSettings
  ) {
    super(leaf);
  }

  getViewType(): string {
    return TEXT_FILE_LIST_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "文本文件";
  }

  getIcon(): string {
    return "file-text";
  }

  async onOpen(): Promise<void> {
    await this.render();
    this.registerEvent(this.app.vault.on("create", () => void this.render()));
    this.registerEvent(this.app.vault.on("delete", () => void this.render()));
    this.registerEvent(this.app.vault.on("rename", () => void this.render()));
  }

  private async render(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("text-file-list");

    const header = container.createDiv({ cls: "text-file-list__header" });
    header.createDiv({ cls: "text-file-list__title", text: "文本文件" });
    const countEl = header.createDiv({ cls: "text-file-list__count", text: "扫描中" });

    let files: TextFileListItem[];
    try {
      files = await scanSupportedTextFiles({
        list: (path) => this.app.vault.adapter.list(path),
        supportedExtensions: this.settingsProvider().supportedExtensions
      });
    } catch (error) {
      console.error(error);
      countEl.setText("失败");
      container.createDiv({
        cls: "text-file-list__empty",
        text: "扫描文本文件失败，请确认 Obsidian 有访问当前库的权限。"
      });
      return;
    }

    countEl.setText(`${files.length} 个`);

    if (files.length === 0) {
      container.createDiv({
        cls: "text-file-list__empty",
        text: "当前库中没有匹配的文本文件。"
      });
      return;
    }

    const list = container.createDiv({ cls: "text-file-list__items" });
    for (const file of files) {
      const row = list.createEl("button", {
        cls: "text-file-list__item",
        attr: { type: "button" }
      });
      row.createDiv({ cls: "text-file-list__item-name", text: file.name });
      row.createDiv({ cls: "text-file-list__item-path", text: file.path });
      row.onClickEvent(() => {
        void this.openFile(file.path);
      });
    }
  }

  private async openFile(path: string): Promise<void> {
    const file = this.app.vault.getFileByPath(path);
    const leaf = this.app.workspace.getLeaf(false);
    if (file instanceof TFile) {
      await leaf.openFile(file);
    } else {
      await leaf.setViewState({
        type: TEXT_FILE_EDITOR_VIEW_TYPE,
        state: { file: path },
        active: true
      });
    }
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }
}
