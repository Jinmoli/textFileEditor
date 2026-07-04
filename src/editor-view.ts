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
import { groovy } from "@codemirror/legacy-modes/mode/groovy";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { properties } from "@codemirror/legacy-modes/mode/properties";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search";
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
import { classHighlighter } from "@lezer/highlight";
import { PROPERTIES_TOKEN_TABLE, editorHighlightStyle } from "./editor-highlighting";
import { EDITOR_ZH_CN_PHRASES } from "./editor-localization";
import { createTextFileSearchPanel } from "./editor-search-panel";
import { editorRuntimeTheme } from "./editor-runtime-theme";
import { openEditorSearchPanel } from "./editor-search";
import { createLegacyHighlightFallback } from "./legacy-highlight-fallback";
import { getEditorShortcutAction, shouldHandleEditorShortcutEvent } from "./editor-shortcuts";
import { getExtensionLanguageKey, normalizeExtension, type LanguageKey } from "./extension-map";
import {
  buildOriginalFileSnapshot,
  shouldNoticeSpecialLineEnding,
  type OriginalFileSnapshot
} from "./file-fidelity";
import {
  UNKNOWN_FILE_METADATA,
  exceedsLargeFileThreshold,
  formatFileSize,
  formatModifiedTime,
  type TextFileMetadata
} from "./file-metadata";
import { readTextFileContent } from "./file-content";
import { formatTextContent, isFormattingSupported } from "./text-format";
import { decodePropertiesTextForDisplay, encodePropertiesTextForStorage, shouldUsePropertiesEscapes } from "./properties-text";
import { batchParser, shellParser } from "./script-highlighting";
import { normalizeEncodingInput, type TextFileEncoding } from "./text-encoding";
import type { TextFileEditorSettings } from "./settings-core";

export const TEXT_FILE_EDITOR_VIEW_TYPE = "text-file-editor-view";

const LANGUAGE_SUPPORT: Record<Exclude<LanguageKey, "text">, () => Extension> = {
  batch: () => StreamLanguage.define(batchParser),
  css,
  dockerfile: () => StreamLanguage.define(dockerFile),
  groovy: () => StreamLanguage.define(groovy),
  html,
  java,
  javascript,
  json,
  properties: () =>
    StreamLanguage.define({
      ...properties,
      tokenTable: PROPERTIES_TOKEN_TABLE
    }),
  powershell: () => StreamLanguage.define(powerShell),
  shell: () => StreamLanguage.define(shellParser),
  sql,
  toml: () => StreamLanguage.define(toml),
  xml,
  yaml
};

const ENCODING_OPTIONS: ReadonlyArray<{ value: TextFileEncoding; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "ascii", label: "ASCII" },
  { value: "utf-8", label: "UTF-8" },
  { value: "gbk", label: "GBK" },
  { value: "gb18030", label: "GB18030" },
  { value: "big5", label: "Big5" },
  { value: "shift_jis", label: "Shift_JIS" },
  { value: "utf-16le", label: "UTF-16 LE" },
  { value: "utf-16be", label: "UTF-16 BE" }
];

export class TextFileEditorView extends FileView {
  private encodingSelectEl: HTMLSelectElement | null = null;
  private editor: EditorView | null = null;
  private editorHostEl: HTMLElement | null = null;
  private formatButton: ButtonComponent | null = null;
  private findButton: ButtonComponent | null = null;
  private readOnlyButton: ButtonComponent | null = null;
  private reloadButton: ButtonComponent | null = null;
  private saveButton: ButtonComponent | null = null;
  private statusEl: HTMLElement | null = null;
  private wrapButton: ButtonComponent | null = null;
  private pathOnlyFile: TextFilePathTarget | null = null;
  private readonly readOnlyCompartment = new Compartment();
  private readonly wrapCompartment = new Compartment();
  private readonly fileStates = new Map<string, FileEditorState>();
  private cleanContent = "";
  private currentEncoding: TextFileEncoding = "utf-8";
  private currentLanguage: LanguageKey = "text";
  private currentMetadata: TextFileMetadata = UNKNOWN_FILE_METADATA;
  private originalSnapshot: OriginalFileSnapshot | null = null;
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

  onload(): void {
    super.onload();
    this.registerDomEvent(
      document,
      "keydown",
      (event) => {
        this.handleDocumentKeydown(event);
      },
      { capture: true }
    );
    this.registerDomEvent(
      window,
      "keydown",
      (event) => {
        this.handleDocumentKeydown(event);
      },
      { capture: true }
    );
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
      const storageContent = shouldUsePropertiesEscapes(target.extension) ? encodePropertiesTextForStorage(content) : content;
      if (this.currentEncoding !== "utf-8" && this.currentEncoding !== "ascii") {
        const shouldSave = window.confirm(
          `当前文件按 ${formatEncodingLabel(this.currentEncoding)} 显示。受 Obsidian 写入能力限制，保存后文件编码可能变为 UTF-8。确定继续保存吗？`
        );
        if (!shouldSave) {
          return;
        }
      }
      if (target.file) {
        await this.app.vault.modify(target.file, storageContent);
      } else {
        await this.app.vault.adapter.write(target.path, storageContent);
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
    this.rememberCurrentFileState();
    this.editor?.dispatch({
      effects: this.readOnlyCompartment.reconfigure(EditorState.readOnly.of(this.isReadOnly))
    });
    this.updateToolbarState();
    this.updateStatus();
  }

  toggleWordWrap(): void {
    this.isWordWrap = !this.isWordWrap;
    this.rememberCurrentFileState();
    this.editor?.dispatch({
      effects: this.wrapCompartment.reconfigure(this.isWordWrap ? EditorView.lineWrapping : [])
    });
    this.updateToolbarState();
    this.updateStatus();
  }

  formatCurrentContent(): void {
    if (this.isReadOnly) {
      new Notice("当前文件处于只读模式，请先切换为可编辑后再格式化。");
      return;
    }

    if (!this.editor) {
      new Notice("当前没有可格式化的文本文件。");
      return;
    }

    if (!isFormattingSupported(this.currentLanguage)) {
      new Notice("当前文件类型暂不支持格式化。");
      return;
    }

    try {
      const currentContent = this.editor.state.doc.toString();
      const formatted = formatTextContent(currentContent, this.currentLanguage).content;
      if (formatted === currentContent) {
        new Notice("当前内容已是较易读格式，无需再次格式化。");
        return;
      }

      this.editor.dispatch({
        changes: {
          from: 0,
          to: this.editor.state.doc.length,
          insert: formatted
        }
      });
      new Notice("已完成格式化，可继续检查后保存。");
    } catch (error) {
      new Notice(error instanceof Error ? error.message : "格式化失败，请先确认当前文件语法完整。");
    }
  }

  private renderShell(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass("text-file-editor");

    const toolbar = container.createDiv({ cls: "text-file-editor__toolbar" });

    this.saveButton = this.createToolbarButton(toolbar, "save", "保存", `保存当前文件（${this.settingsProvider().saveShortcutHint}）`, () => {
      void this.save();
    });
    this.saveButton.buttonEl.addClass("text-file-editor__button--primary");

    this.reloadButton = this.createToolbarButton(toolbar, "refresh-cw", "重新加载", "从磁盘重新读取文件内容", () => {
      void this.reload();
    });

    this.formatButton = this.createToolbarButton(toolbar, "wand-sparkles", "格式化", "整理当前文件内容，提升可读性", () => {
      this.formatCurrentContent();
    });

    this.findButton = this.createToolbarButton(toolbar, "search", "查找", "在当前文件中查找（Ctrl/Cmd + F）", () => {
      this.openFindPanel();
    });

    this.readOnlyButton = this.createToolbarButton(toolbar, "unlock", "可编辑", "切换只读/编辑模式", () => {
      this.toggleReadOnly();
    });

    this.wrapButton = this.createToolbarButton(toolbar, "wrap-text", "自动换行", "切换自动换行", () => {
      this.toggleWordWrap();
    });

    const encodingGroup = toolbar.createDiv({ cls: "text-file-editor__encoding" });
    encodingGroup.createSpan({ cls: "text-file-editor__encoding-label", text: "编码" });
    this.encodingSelectEl = encodingGroup.createEl("select", { cls: "text-file-editor__encoding-select" });
    for (const option of ENCODING_OPTIONS) {
      this.encodingSelectEl.createEl("option", {
        attr: { value: option.value },
        text: option.label
      });
    }
    this.encodingSelectEl.value = this.currentEncoding;
    this.encodingSelectEl.onchange = () => {
      void this.switchEncoding(normalizeEncodingInput(this.encodingSelectEl?.value));
    };

    this.statusEl = toolbar.createDiv({ cls: "text-file-editor__status" });
    this.editorHostEl = container.createDiv({ cls: "text-file-editor__host" });
    this.updateToolbarState();
  }

  private async loadFileContent(file: TFile, preferredEncoding = this.settingsProvider().encoding): Promise<void> {
    if (!this.editorHostEl) {
      this.renderShell();
    }

    this.isLoading = true;
    this.originalSnapshot = null;
    try {
      this.currentMetadata = {
        size: file.stat.size,
        mtime: file.stat.mtime
      };
      this.applyFileState(file.path);
      this.applyLargeFileModeIfNeeded(file.name);
      const result = await readTextFileContent({
        path: file.path,
        name: file.name,
        vaultRead: () => this.app.vault.read(file),
        adapterRead: (path) => this.app.vault.adapter.read(path),
        adapterReadBinary: (path) => this.app.vault.adapter.readBinary(path),
        preferredEncoding
      });
      this.currentEncoding = result.encoding;
      this.originalSnapshot = buildOriginalFileSnapshot({
        content: result.content,
        encoding: result.encoding,
        fileType: shouldUsePropertiesEscapes(file.extension) ? "properties" : "text"
      });
      this.noticeSpecialLineEnding(file.name, this.originalSnapshot.lineEnding);
      const displayContent = shouldUsePropertiesEscapes(file.extension) ? decodePropertiesTextForDisplay(result.content) : result.content;
      this.cleanContent = displayContent;
      this.createEditor(displayContent, file.extension);
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

  private async loadPathContent(target: TextFilePathTarget, preferredEncoding = this.settingsProvider().encoding): Promise<void> {
    if (!this.editorHostEl) {
      this.renderShell();
    }

    this.isLoading = true;
    this.originalSnapshot = null;
    try {
      this.currentMetadata = await this.readPathMetadata(target.path);
      this.applyFileState(target.path);
      this.applyLargeFileModeIfNeeded(target.name);
      const result = await readTextFileContent({
        path: target.path,
        name: target.name,
        vaultRead: async () => {
          throw new Error("文件尚未进入 Obsidian 文件索引。");
        },
        adapterRead: (path) => this.app.vault.adapter.read(path),
        adapterReadBinary: (path) => this.app.vault.adapter.readBinary(path),
        preferredEncoding
      });
      this.currentEncoding = result.encoding;
      this.originalSnapshot = buildOriginalFileSnapshot({
        content: result.content,
        encoding: result.encoding,
        fileType: shouldUsePropertiesEscapes(target.extension) ? "properties" : "text"
      });
      this.noticeSpecialLineEnding(target.name, this.originalSnapshot.lineEnding);
      const displayContent = shouldUsePropertiesEscapes(target.extension) ? decodePropertiesTextForDisplay(result.content) : result.content;
      this.cleanContent = displayContent;
      this.createEditor(displayContent, target.extension);
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

  private async switchEncoding(encoding: TextFileEncoding): Promise<void> {
    const target = this.getCurrentTarget();
    if (!target) {
      new Notice("当前没有可切换编码的文本文件。");
      return;
    }

    if (this.isDirty) {
      const shouldSwitch = window.confirm(`文件“${target.name}”还有未保存的修改，切换编码会从磁盘重新读取并丢失这些修改。确定继续吗？`);
      if (!shouldSwitch) {
        this.updateToolbarState();
        return;
      }
    }

    if (target.file) {
      await this.loadFileContent(target.file, encoding);
    } else {
      await this.loadPathContent(target, encoding);
    }
    new Notice(`已按 ${formatEncodingLabel(this.currentEncoding)} 重新读取：${target.name}`);
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
    this.updateToolbarState();
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
      EditorState.phrases.of(EDITOR_ZH_CN_PHRASES),
      indentOnInput(),
      search({
        top: true,
        createPanel: createTextFileSearchPanel
      }),
      editorRuntimeTheme,
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      syntaxHighlighting(editorHighlightStyle),
      syntaxHighlighting(classHighlighter),
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
    const languageExtension = LANGUAGE_SUPPORT[languageKey]();
    return [languageExtension, this.getLegacyHighlightFallback(languageKey)];
  }

  private getLegacyHighlightFallback(languageKey: LanguageKey): Extension {
    if (languageKey === "properties" || languageKey === "shell" || languageKey === "batch") {
      return createLegacyHighlightFallback(languageKey);
    }
    return [];
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
    const lineEnding = formatLineEndingLabel(this.originalSnapshot?.lineEnding ?? "unknown");
    this.statusEl.setText(
      `${dirty} · ${mode} · ${wrap} · ${language} · ${this.currentEncoding.toUpperCase()} · ${lineEnding} · ${size} · ${modified} · ${this.cursorLine}:${this.cursorColumn}`
    );
  }

  private updateToolbarState(): void {
    this.setToolbarButtonContent(this.readOnlyButton, this.isReadOnly ? "lock" : "unlock", this.isReadOnly ? "只读" : "可编辑");
    this.setToolbarButtonContent(this.wrapButton, "wrap-text", this.isWordWrap ? "自动换行" : "不换行");

    this.readOnlyButton?.buttonEl.classList.toggle("is-active", this.isReadOnly);
    this.wrapButton?.buttonEl.classList.toggle("is-active", this.isWordWrap);
    this.readOnlyButton?.buttonEl.setAttribute("aria-pressed", String(this.isReadOnly));
    this.wrapButton?.buttonEl.setAttribute("aria-pressed", String(this.isWordWrap));
    if (this.formatButton) {
      this.formatButton.buttonEl.disabled = this.isReadOnly || !isFormattingSupported(this.currentLanguage);
    }

    if (this.encodingSelectEl) {
      this.encodingSelectEl.value = this.currentEncoding;
    }
  }

  private updateCursorStatus(state: EditorState): void {
    const position = state.selection.main.head;
    const line = state.doc.lineAt(position);
    this.cursorLine = line.number;
    this.cursorColumn = position - line.from + 1;
    this.updateStatus();
  }

  private handleDocumentKeydown(event: KeyboardEvent): void {
    const action = getEditorShortcutAction(event);
    if (!action || !this.shouldHandleEditorShortcut(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (action === "save") {
      void this.save();
      return;
    }

    this.openFindPanel();
  }

  private shouldHandleEditorShortcut(event: KeyboardEvent): boolean {
    const isActiveView = this.app.workspace.getActiveViewOfType(TextFileEditorView) === this;
    const target = event.target;
    const targetInsideEditor = target instanceof Node && this.contentEl.contains(target);
    return shouldHandleEditorShortcutEvent(isActiveView, targetInsideEditor);
  }

  private openFindPanel(): void {
    if (!this.editor) {
      new Notice("当前没有可查找的文本文件。");
      return;
    }

    openEditorSearchPanel(this.editor);
  }

  private createToolbarButton(
    toolbar: HTMLElement,
    icon: string,
    label: string,
    tooltip: string,
    onClick: () => void
  ): ButtonComponent {
    const button = new ButtonComponent(toolbar).setTooltip(tooltip).onClick(onClick);
    button.buttonEl.addClass("text-file-editor__button");
    this.setToolbarButtonContent(button, icon, label);
    return button;
  }

  private setToolbarButtonContent(button: ButtonComponent | null, icon: string, label: string): void {
    if (!button) {
      return;
    }
    button.buttonEl.empty();
    button.setIcon(icon);
    button.buttonEl.createSpan({ cls: "text-file-editor__button-label", text: label });
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
      this.rememberCurrentFileState();
    }
  }

  private applyFileState(path: string): void {
    const saved = this.fileStates.get(path);
    const settings = this.settingsProvider();
    this.isReadOnly = saved?.readOnly ?? settings.defaultReadOnly;
    this.isWordWrap = saved?.wordWrap ?? settings.defaultWordWrap;
  }

  private rememberCurrentFileState(): void {
    const target = this.getCurrentTarget();
    if (!target) {
      return;
    }
    this.fileStates.set(target.path, {
      readOnly: this.isReadOnly,
      wordWrap: this.isWordWrap
    });
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

  private noticeSpecialLineEnding(fileName: string, lineEnding: OriginalFileSnapshot["lineEnding"]): void {
    if (shouldNoticeSpecialLineEnding(lineEnding)) {
      new Notice(`文件“${fileName}”包含混合换行。插件会按原内容保守保存，建议保存前先确认是否需要统一换行格式。`, 7000);
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

interface FileEditorState {
  readOnly: boolean;
  wordWrap: boolean;
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

function formatEncodingLabel(encoding: TextFileEncoding): string {
  return ENCODING_OPTIONS.find((option) => option.value === encoding)?.label ?? encoding.toUpperCase();
}

function formatLineEndingLabel(lineEnding: OriginalFileSnapshot["lineEnding"]): string {
  switch (lineEnding) {
    case "crlf":
      return "CRLF";
    case "lf":
      return "LF";
    case "mixed":
      return "混合换行";
    default:
      return "换行未知";
  }
}
