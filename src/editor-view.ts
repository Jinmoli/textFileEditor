import { ButtonComponent, FileView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { Compartment, EditorState, Extension } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { getExtensionLanguageKey, type LanguageKey } from "./extension-map";
import type { TextFileEditorSettings } from "./settings-core";

export const TEXT_FILE_EDITOR_VIEW_TYPE = "text-file-editor-view";

const LANGUAGE_SUPPORT: Record<Exclude<LanguageKey, "text">, () => Extension> = {
  html,
  json,
  sql,
  xml,
  yaml
};

export class TextFileEditorView extends FileView {
  private editor: EditorView | null = null;
  private editorHostEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private readonly readOnlyCompartment = new Compartment();
  private readonly wrapCompartment = new Compartment();
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
    return this.file?.basename ?? "Text File Editor";
  }

  getIcon(): string {
    return "file-text";
  }

  async onLoadFile(file: TFile): Promise<void> {
    await super.onLoadFile(file);
    this.renderShell();
    await this.loadFileContent(file);
  }

  async onUnloadFile(file: TFile): Promise<void> {
    if (this.isDirty) {
      const shouldDiscard = window.confirm(`文件“${file.name}”还有未保存的修改，关闭后这些修改会丢失。确定要关闭吗？`);
      if (!shouldDiscard) {
        return;
      }
    }
    this.editor?.destroy();
    this.editor = null;
    await super.onUnloadFile(file);
  }

  async save(): Promise<void> {
    const file = this.file;
    const editor = this.editor;
    if (!file || !editor) {
      new Notice("当前没有可保存的文本文件。");
      return;
    }

    try {
      const content = editor.state.doc.toString();
      await this.app.vault.modify(file, content);
      this.cleanContent = content;
      this.setDirty(false);
      new Notice(`已保存：${file.name}`);
    } catch (error) {
      console.error(error);
      new Notice("保存失败，请确认文件未被占用且磁盘可写。");
    }
  }

  async reload(): Promise<void> {
    const file = this.file;
    if (!file) {
      new Notice("当前没有可重新加载的文本文件。");
      return;
    }

    if (this.isDirty) {
      const shouldReload = window.confirm(`文件“${file.name}”还有未保存的修改，重新加载会丢失这些修改。确定继续吗？`);
      if (!shouldReload) {
        return;
      }
    }

    await this.loadFileContent(file);
  }

  toggleReadOnly(): void {
    this.isReadOnly = !this.isReadOnly;
    this.editor?.dispatch({
      effects: this.readOnlyCompartment.reconfigure(EditorState.readOnly.of(this.isReadOnly))
    });
    this.updateStatus();
  }

  toggleWordWrap(): void {
    this.isWordWrap = !this.isWordWrap;
    this.editor?.dispatch({
      effects: this.wrapCompartment.reconfigure(this.isWordWrap ? EditorView.lineWrapping : [])
    });
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
      const content = await this.app.vault.read(file);
      this.cleanContent = content;
      this.createEditor(content, file.extension);
      this.setDirty(false);
    } catch (error) {
      console.error(error);
      this.contentEl.empty();
      this.contentEl.createDiv({
        cls: "text-file-editor__error",
        text: "无法读取文件，请确认文件仍存在且 Obsidian 有访问权限。"
      });
    } finally {
      this.isLoading = false;
    }
  }

  private createEditor(content: string, extension: string): void {
    if (!this.editorHostEl) {
      return;
    }

    this.editor?.destroy();
    this.editorHostEl.empty();

    this.editor = new EditorView({
      parent: this.editorHostEl,
      state: EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          this.getLanguageExtension(extension),
          this.readOnlyCompartment.of(EditorState.readOnly.of(this.isReadOnly)),
          this.wrapCompartment.of(this.isWordWrap ? EditorView.lineWrapping : []),
          EditorView.updateListener.of((update) => {
            if (!this.isLoading && update.docChanged) {
              this.setDirty(update.state.doc.toString() !== this.cleanContent);
            }
          })
        ]
      })
    });
  }

  private getLanguageExtension(extension: string): Extension {
    const languageKey = getExtensionLanguageKey(extension);
    if (languageKey === "text") {
      return [];
    }
    return LANGUAGE_SUPPORT[languageKey]();
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
}
