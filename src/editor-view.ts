import { ButtonComponent, FileView, Notice, TFile, WorkspaceLeaf, type ViewStateResult } from "obsidian";
import { normalizeExtension } from "./extension-map";
import { readTextFileContent } from "./file-content";
import type { TextFileEditorSettings } from "./settings-core";

export const TEXT_FILE_EDITOR_VIEW_TYPE = "text-file-editor-view";

export class TextFileEditorView extends FileView {
  private editor: HTMLTextAreaElement | null = null;
  private editorHostEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private pathOnlyFile: TextFilePathTarget | null = null;
  private cleanContent = "";
  private isDirty = false;
  private isLoading = false;
  private isReadOnly: boolean;
  private isWordWrap: boolean;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly settingsProvider: () => TextFileEditorSettings
  ) {
    super(leaf);
    const settings = this.settingsProvider();
    this.isReadOnly = settings.defaultReadOnly;
    this.isWordWrap = settings.defaultWordWrap;
  }

  getViewType(): string {
    return TEXT_FILE_EDITOR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename ?? this.pathOnlyFile?.name ?? "Text File Editor";
  }

  getIcon(): string {
    return "file-text";
  }

  canAcceptExtension(extension: string): boolean {
    return this.settingsProvider().supportedExtensions.includes(normalizeExtension(extension));
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.pathOnlyFile = null;
    await super.onLoadFile(file);
    this.renderShell();
    await this.loadFileContent(file);
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    const path = getStateFilePath(state);
    const indexedFile = path ? this.app.vault.getFileByPath(path) : null;
    if (path && !(indexedFile instanceof TFile) && this.canAcceptExtension(getExtensionFromPath(path))) {
      this.pathOnlyFile = createPathTarget(path);
      this.renderShell();
      await this.loadPathContent(this.pathOnlyFile);
      result.history = true;
      return;
    }

    await super.setState(state, result);
  }

  async onUnloadFile(file: TFile): Promise<void> {
    if (this.isDirty) {
      const shouldDiscard = window.confirm(`文件“${file.name}”还有未保存的修改，关闭后这些修改会丢失。确定要关闭吗？`);
      if (!shouldDiscard) {
        return;
      }
    }
    this.editor = null;
    await super.onUnloadFile(file);
  }

  async save(): Promise<void> {
    const target = this.getCurrentTarget();
    const editor = this.editor;
    if (!target || !editor) {
      new Notice("当前没有可保存的文本文件。");
      return;
    }

    try {
      const content = editor.value;
      if (target.file) {
        await this.app.vault.modify(target.file, content);
      } else {
        await this.app.vault.adapter.write(target.path, content);
      }
      this.cleanContent = content;
      this.setDirty(false);
      new Notice(`已保存：${target.name}`);
    } catch (error) {
      console.error(error);
      new Notice("保存失败，请确认文件未被占用且磁盘可写。");
    }
  }

  async reload(): Promise<void> {
    const target = this.getCurrentTarget();
    if (!target) {
      new Notice("当前没有可重新加载的文本文件。");
      return;
    }

    if (this.isDirty) {
      const shouldReload = window.confirm(`文件“${target.name}”还有未保存的修改，重新加载会丢失这些修改。确定继续吗？`);
      if (!shouldReload) {
        return;
      }
    }

    if (target.file) {
      await this.loadFileContent(target.file);
    } else {
      await this.loadPathContent(target);
    }
  }

  toggleReadOnly(): void {
    this.isReadOnly = !this.isReadOnly;
    this.applyEditorMode();
    this.updateStatus();
  }

  toggleWordWrap(): void {
    this.isWordWrap = !this.isWordWrap;
    this.applyEditorMode();
    this.updateStatus();
  }

  private renderShell(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass("text-file-editor");

    const toolbar = container.createDiv({ cls: "text-file-editor__toolbar" });

    new ButtonComponent(toolbar)
      .setButtonText("保存")
      .setTooltip(`保存当前文件（${this.settingsProvider().saveShortcutHint}）`)
      .onClick(() => {
        void this.save();
      });

    new ButtonComponent(toolbar)
      .setButtonText("重新加载")
      .setTooltip("从磁盘重新读取文件内容")
      .onClick(() => {
        void this.reload();
      });

    new ButtonComponent(toolbar)
      .setButtonText("只读")
      .setTooltip("切换只读/编辑模式")
      .onClick(() => {
        this.toggleReadOnly();
      });

    new ButtonComponent(toolbar)
      .setButtonText("换行")
      .setTooltip("切换自动换行")
      .onClick(() => {
        this.toggleWordWrap();
      });

    this.statusEl = toolbar.createDiv({ cls: "text-file-editor__status" });
    this.editorHostEl = container.createDiv({ cls: "text-file-editor__host" });
  }

  private async loadFileContent(file: TFile): Promise<void> {
    if (!this.editorHostEl) {
      this.renderShell();
    }

    this.isLoading = true;
    try {
      const content = await readTextFileContent({
        path: file.path,
        name: file.name,
        vaultRead: () => this.app.vault.read(file),
        adapterRead: (path) => this.app.vault.adapter.read(path)
      });
      this.cleanContent = content;
      this.createEditor(content);
      this.setDirty(false);
    } catch (error) {
      console.error(error);
      this.contentEl.empty();
      this.contentEl.createDiv({
        cls: "text-file-editor__error",
        text: error instanceof Error ? error.message : "无法读取文件，请确认文件仍存在且 Obsidian 有访问权限。"
      });
    } finally {
      this.isLoading = false;
    }
  }

  private async loadPathContent(target: TextFilePathTarget): Promise<void> {
    if (!this.editorHostEl) {
      this.renderShell();
    }

    this.isLoading = true;
    try {
      const content = await readTextFileContent({
        path: target.path,
        name: target.name,
        vaultRead: async () => {
          throw new Error("文件尚未进入 Obsidian 文件索引。");
        },
        adapterRead: (path) => this.app.vault.adapter.read(path)
      });
      this.cleanContent = content;
      this.createEditor(content);
      this.setDirty(false);
    } catch (error) {
      console.error(error);
      this.contentEl.empty();
      this.contentEl.createDiv({
        cls: "text-file-editor__error",
        text: error instanceof Error ? error.message : "无法读取文件，请确认文件仍存在且 Obsidian 有访问权限。"
      });
    } finally {
      this.isLoading = false;
    }
  }

  private getCurrentTarget(): TextFileTarget | null {
    if (this.file) {
      return {
        file: this.file,
        path: this.file.path,
        name: this.file.name,
        extension: this.file.extension
      };
    }
    return this.pathOnlyFile;
  }

  private createEditor(content: string): void {
    if (!this.editorHostEl) {
      return;
    }

    this.editorHostEl.empty();

    const textarea = this.editorHostEl.createEl("textarea", {
      cls: "text-file-editor__textarea",
      attr: {
        "aria-label": "文本文件内容",
        spellcheck: "false"
      }
    });
    textarea.value = content;
    textarea.oninput = () => {
      if (!this.isLoading) {
        this.setDirty(textarea.value !== this.cleanContent);
      }
    };
    this.editor = textarea;
    this.applyEditorMode();
  }

  private setDirty(value: boolean): void {
    this.isDirty = value;
    this.updateStatus();
  }

  private updateStatus(): void {
    if (!this.statusEl) {
      return;
    }

    const mode = this.isReadOnly ? "只读" : "可编辑";
    const wrap = this.isWordWrap ? "自动换行" : "不换行";
    const dirty = this.isDirty ? "未保存" : "已保存";
    this.statusEl.setText(`${dirty} · ${mode} · ${wrap}`);
  }

  private applyEditorMode(): void {
    if (!this.editor) {
      return;
    }

    this.editor.readOnly = this.isReadOnly;
    this.editor.wrap = this.isWordWrap ? "soft" : "off";
    this.editor.classList.toggle("text-file-editor__textarea--no-wrap", !this.isWordWrap);
  }
}

interface TextFilePathTarget {
  file?: undefined;
  path: string;
  name: string;
  extension: string;
}

interface IndexedTextFileTarget {
  file: TFile;
  path: string;
  name: string;
  extension: string;
}

type TextFileTarget = TextFilePathTarget | IndexedTextFileTarget;

function getStateFilePath(state: unknown): string | null {
  if (state && typeof state === "object" && "file" in state && typeof state.file === "string") {
    return state.file;
  }
  return null;
}

function createPathTarget(path: string): TextFilePathTarget {
  const name = path.split("/").pop() ?? path;
  return {
    path,
    name,
    extension: getExtensionFromPath(path)
  };
}

function getExtensionFromPath(path: string): string {
  const name = path.split("/").pop() ?? path;
  return normalizeExtension(name.includes(".") ? name.split(".").pop() ?? "" : "");
}
