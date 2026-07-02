import { ButtonComponent, FileView, Notice, TFile, WorkspaceLeaf, type ViewStateResult } from "obsidian";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  StreamLanguage,
  syntaxHighlighting
} from "@codemirror/language";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { properties } from "@codemirror/legacy-modes/mode/properties";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState, Extension } from "@codemirror/state";
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection
} from "@codemirror/view";
import { getExtensionLanguageKey, normalizeExtension, type LanguageKey } from "./extension-map";
import {
  UNKNOWN_FILE_METADATA,
  exceedsLargeFileThreshold,
  formatFileSize,
  formatModifiedTime,
  type TextFileMetadata
} from "./file-metadata";
import { readTextFileContent } from "./file-content";
import type { TextFileEncoding } from "./text-encoding";
import type { TextFileEditorSettings } from "./settings-core";

export const TEXT_FILE_EDITOR_VIEW_TYPE = "text-file-editor-view";

const LANGUAGE_SUPPORT: Record<Exclude<LanguageKey, "text">, () => Extension> = {
  css,
  dockerfile: () => StreamLanguage.define(dockerFile),
  html,
  java,
  javascript,
  json,
  properties: () => StreamLanguage.define(properties),
  powershell: () => StreamLanguage.define(powerShell),
  shell: () => StreamLanguage.define(shell),
  sql,
  toml: () => StreamLanguage.define(toml),
  xml,
  yaml
};

export class TextFileEditorView extends FileView {
  private editor: EditorView | null = null;
  private editorHostEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private pathOnlyFile: TextFilePathTarget | null = null;
  private readonly readOnlyCompartment = new Compartment();
  private readonly wrapCompartment = new Compartment();
  private cleanContent = "";
  private currentEncoding: TextFileEncoding = "utf-8";
  private currentLanguage: LanguageKey = "text";
  private currentMetadata: TextFileMetadata = UNKNOWN_FILE_METADATA;
  private cursorLine = 1;
  private cursorColumn = 1;
  private draftIntervalId: number | null = null;
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
    this.editor?.destroy();
    this.editor = null;
    this.stopDraftAutosave();
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
      const content = editor.state.doc.toString();
      if (target.file) {
        await this.app.vault.modify(target.file, content);
      } else {
        await this.app.vault.adapter.write(target.path, content);
      }
      this.cleanContent = content;
      this.setDirty(false);
      await this.clearDraft(target);
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
      this.currentMetadata = {
        size: file.stat.size,
        mtime: file.stat.mtime
      };
      this.applyLargeFileModeIfNeeded(file.name);
      const result = await readTextFileContent({
        path: file.path,
        name: file.name,
        vaultRead: () => this.app.vault.read(file),
        adapterRead: (path) => this.app.vault.adapter.read(path),
        adapterReadBinary: (path) => this.app.vault.adapter.readBinary(path),
        preferredEncoding: this.settingsProvider().encoding
      });
      this.currentEncoding = result.encoding;
      this.cleanContent = result.content;
      this.createEditor(result.content, file.extension);
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
      this.currentMetadata = await this.readPathMetadata(target.path);
      this.applyLargeFileModeIfNeeded(target.name);
      const result = await readTextFileContent({
        path: target.path,
        name: target.name,
        vaultRead: async () => {
          throw new Error("文件尚未进入 Obsidian 文件索引。");
        },
        adapterRead: (path) => this.app.vault.adapter.read(path),
        adapterReadBinary: (path) => this.app.vault.adapter.readBinary(path),
        preferredEncoding: this.settingsProvider().encoding
      });
      this.currentEncoding = result.encoding;
      this.cleanContent = result.content;
      this.createEditor(result.content, target.extension);
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

  private createEditor(content: string, extension: string): void {
    if (!this.editorHostEl) {
      return;
    }

    this.editor?.destroy();
    this.editorHostEl.empty();
    this.currentLanguage = getExtensionLanguageKey(extension);
    this.cursorLine = 1;
    this.cursorColumn = 1;

    this.editor = new EditorView({
      parent: this.editorHostEl,
      state: EditorState.create({
        doc: content,
        extensions: [
          this.createBaseEditorExtensions(),
          this.getLanguageExtension(extension),
          this.readOnlyCompartment.of(EditorState.readOnly.of(this.isReadOnly)),
          this.wrapCompartment.of(this.isWordWrap ? EditorView.lineWrapping : []),
          EditorView.updateListener.of((update) => {
            if (!this.isLoading && update.docChanged) {
              this.setDirty(update.state.doc.toString() !== this.cleanContent);
            }
            if (update.selectionSet || update.docChanged) {
              this.updateCursorStatus(update.state);
            }
          })
        ]
      })
    });
    this.updateCursorStatus(this.editor.state);
    this.startDraftAutosave();
  }

  private createBaseEditorExtensions(): Extension[] {
    return [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        {
          key: "Mod-s",
          run: () => {
            void this.save();
            return true;
          }
        },
        indentWithTab,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap
      ])
    ];
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
    const size = formatFileSize(this.currentMetadata.size);
    const modified = formatModifiedTime(this.currentMetadata.mtime);
    const language = this.currentLanguage === "text" ? "纯文本" : this.currentLanguage.toUpperCase();
    this.statusEl.setText(
      `${dirty} · ${mode} · ${wrap} · ${language} · ${this.currentEncoding.toUpperCase()} · ${size} · ${modified} · ${this.cursorLine}:${this.cursorColumn}`
    );
  }

  private updateCursorStatus(state: EditorState): void {
    const position = state.selection.main.head;
    const line = state.doc.lineAt(position);
    this.cursorLine = line.number;
    this.cursorColumn = position - line.from + 1;
    this.updateStatus();
  }

  private applyLargeFileModeIfNeeded(fileName: string): void {
    const settings = this.settingsProvider();
    if (!exceedsLargeFileThreshold(this.currentMetadata.size, settings.largeFileWarningSizeMb)) {
      return;
    }

    const size = formatFileSize(this.currentMetadata.size);
    const shouldOpenReadOnly = window.confirm(
      `文件“${fileName}”大小为 ${size}，编辑大文件可能造成卡顿。点击“确定”以只读方式打开，点击“取消”继续可编辑打开。`
    );
    if (shouldOpenReadOnly) {
      this.isReadOnly = true;
    }
  }

  private async readPathMetadata(path: string): Promise<TextFileMetadata> {
    try {
      const stat = await this.app.vault.adapter.stat(path);
      return {
        size: stat?.size ?? null,
        mtime: stat?.mtime ?? null
      };
    } catch (error) {
      console.warn("Text File Editor：读取文件元信息失败。", error);
      return UNKNOWN_FILE_METADATA;
    }
  }

  private startDraftAutosave(): void {
    this.stopDraftAutosave();
    const intervalSeconds = this.settingsProvider().autoSaveDraftIntervalSeconds;
    if (intervalSeconds <= 0) {
      return;
    }

    this.draftIntervalId = window.setInterval(() => {
      void this.saveDraft();
    }, intervalSeconds * 1000);
  }

  private stopDraftAutosave(): void {
    if (this.draftIntervalId !== null) {
      window.clearInterval(this.draftIntervalId);
      this.draftIntervalId = null;
    }
  }

  private async saveDraft(): Promise<void> {
    const target = this.getCurrentTarget();
    if (!target || !this.editor || !this.isDirty) {
      return;
    }

    try {
      await this.ensureDraftFolder();
      await this.app.vault.adapter.write(this.getDraftPath(target), this.editor.state.doc.toString());
    } catch (error) {
      console.warn("Text File Editor：自动保存草稿失败。", error);
    }
  }

  private async clearDraft(target: TextFileTarget): Promise<void> {
    try {
      await this.app.vault.adapter.remove(this.getDraftPath(target));
    } catch {
      // 草稿不存在时无需提示。
    }
  }

  private getDraftPath(target: TextFileTarget): string {
    return `.obsidian/plugins/text-file-editor/drafts/${encodeURIComponent(target.path)}.draft`;
  }

  private async ensureDraftFolder(): Promise<void> {
    try {
      await this.app.vault.adapter.mkdir(".obsidian/plugins/text-file-editor/drafts");
    } catch {
      // 目录已存在时无需处理。
    }
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
