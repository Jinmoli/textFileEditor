import { describe, expect, it } from "vitest";
import { EDITOR_RUNTIME_THEME_SELECTORS } from "./editor-runtime-theme";

describe("editor runtime theme", () => {
  it("covers stream highlighting tokens and search panel selectors", () => {
    expect(EDITOR_RUNTIME_THEME_SELECTORS.customSearchPanel).toContain(".text-file-editor__search-panel");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.customSearchPrimaryRow).toContain("primary");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.customSearchClose).toContain("search-close");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.gutters).toContain(".cm-gutters");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.lineNumber).toContain(".cm-lineNumbers");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.activeLineGutterElement).toContain(".cm-activeLineGutter");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.comment).toContain(".tok-comment");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.keyword).toContain(".tok-keyword");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.property).toContain(".tok-propertyName.tok-definition");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.searchRow).toContain(".cm-search");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.searchMatchSelected).toContain(".cm-searchMatch-selected");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.searchInput).toContain('input[type="text"]');
    expect(EDITOR_RUNTIME_THEME_SELECTORS.searchCheckbox).toContain('input[type="checkbox"]');
    expect(EDITOR_RUNTIME_THEME_SELECTORS.searchBreak).toContain(".cm-search br");
    expect(EDITOR_RUNTIME_THEME_SELECTORS.searchReplaceInput).toContain('input[name="replace"]');
    expect(EDITOR_RUNTIME_THEME_SELECTORS.searchCloseButton).toContain('button[name="close"]');
  });
});
