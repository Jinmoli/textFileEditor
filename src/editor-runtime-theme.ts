import { EditorView } from "@codemirror/view";

export const EDITOR_RUNTIME_THEME_SELECTORS = {
  customSearchPanel: "& .text-file-editor__search-panel",
  customSearchRow: "& .text-file-editor__search-row",
  customSearchPrimaryRow: "& .text-file-editor__search-row--primary",
  customSearchSecondaryRow: "& .text-file-editor__search-row--secondary",
  customSearchInput: "& .text-file-editor__search-input",
  customSearchReplaceInput: "& .text-file-editor__search-input--replace",
  customSearchButton: "& .text-file-editor__search-button",
  customSearchOption: "& .text-file-editor__search-option",
  customSearchClose: "& .text-file-editor__search-close",
  searchPanel: "& .cm-panels",
  searchPanelTop: "& .cm-panels-top",
  searchRow: "& .cm-search",
  searchInput: '& .cm-search input[type="text"]',
  searchCheckbox: '& .cm-search input[type="checkbox"]',
  searchBreak: "& .cm-search br",
  searchReplaceInput: '& .cm-search input[name="replace"]',
  searchReplaceButton: '& .cm-search button[name="replace"]',
  searchReplaceAllButton: '& .cm-search button[name="replaceAll"]',
  searchCloseButton: '& .cm-search button[name="close"]',
  searchButton: "& .cm-search button",
  searchButtonHover: "& .cm-search button:hover",
  searchLabel: "& .cm-search label",
  searchMatch: "& .cm-searchMatch",
  searchMatchSelected: "& .cm-searchMatch.cm-searchMatch-selected",
  comment: "& .tok-comment, & .tok-meta, & .cm-comment",
  keyword: "& .tok-keyword, & .tok-labelName, & .tok-variableName.tok-definition, & .cm-keyword, & .cm-def",
  variable: "& .tok-variableName, & .tok-variableName2, & .cm-variableName",
  property: "& .tok-propertyName, & .tok-propertyName.tok-definition",
  string: "& .tok-string, & .tok-string2, & .cm-string",
  number: "& .tok-number, & .tok-bool, & .tok-atom, & .cm-number",
  operator: "& .tok-operator, & .tok-punctuation, & .cm-operator"
} as const;

export const editorRuntimeTheme = EditorView.theme({
  [EDITOR_RUNTIME_THEME_SELECTORS.customSearchPanel]: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "8px 10px"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.customSearchRow]: {
    alignItems: "center",
    display: "flex",
    gap: "8px"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.customSearchPrimaryRow]: {
    flexWrap: "nowrap"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.customSearchSecondaryRow]: {
    flexWrap: "nowrap"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.customSearchInput]: {
    background: "var(--background-primary-alt, var(--background-primary))",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "6px",
    color: "var(--text-normal)",
    flex: "0 0 230px",
    minHeight: "28px",
    padding: "0 8px"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.customSearchReplaceInput]: {
    flexBasis: "230px"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.customSearchButton]: {
    background: "var(--background-secondary)",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "6px",
    color: "var(--text-normal)",
    minHeight: "28px",
    padding: "0 10px"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.customSearchOption]: {
    alignItems: "center",
    color: "var(--text-muted)",
    display: "inline-flex",
    gap: "4px",
    whiteSpace: "nowrap"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.customSearchClose]: {
    marginLeft: "auto",
    minWidth: "30px",
    padding: "0"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchPanel]: {
    background: "var(--background-primary)",
    color: "var(--text-normal)"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchPanelTop]: {
    borderBottom: "1px solid var(--background-modifier-border)"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchRow]: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "8px 10px"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchInput]: {
    background: "var(--background-primary-alt, var(--background-primary))",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "6px",
    color: "var(--text-normal)",
    flex: "0 0 230px",
    minHeight: "28px",
    padding: "0 8px"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchButton]: {
    background: "var(--background-secondary)",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "6px",
    color: "var(--text-normal)",
    minHeight: "28px",
    padding: "0 10px"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchButtonHover]: {
    background: "var(--background-modifier-hover)"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchLabel]: {
    alignItems: "center",
    color: "var(--text-muted)",
    display: "inline-flex",
    gap: "4px",
    whiteSpace: "nowrap"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchCheckbox]: {
    accentColor: "var(--interactive-accent, #2563eb)",
    margin: "0",
    minHeight: "auto",
    padding: "0",
    width: "14px",
    height: "14px"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchBreak]: {
    display: "block",
    flexBasis: "100%",
    height: "0",
    margin: "0",
    order: "2",
    width: "0"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchReplaceInput]: {
    flexBasis: "230px",
    order: "3"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchReplaceButton]: {
    order: "3"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchReplaceAllButton]: {
    order: "3"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchCloseButton]: {
    marginLeft: "auto",
    order: "1"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchMatch]: {
    background: "color-mix(in srgb, var(--text-accent, #0f766e) 18%, transparent)",
    outline: "1px solid color-mix(in srgb, var(--text-accent, #0f766e) 45%, transparent)"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.searchMatchSelected]: {
    background: "color-mix(in srgb, var(--interactive-accent, #2563eb) 28%, transparent)",
    outlineColor: "color-mix(in srgb, var(--interactive-accent, #2563eb) 55%, transparent)"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.comment]: {
    color: "var(--color-green, #15803d)",
    fontStyle: "italic"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.keyword]: {
    color: "var(--color-purple, #7c3aed)",
    fontWeight: "700"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.variable]: {
    color: "#d336ff"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.property]: {
    color: "var(--color-blue, #2563eb)",
    fontWeight: "600"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.string]: {
    color: "var(--color-green, #15803d)"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.number]: {
    color: "var(--color-orange, #ea580c)"
  },
  [EDITOR_RUNTIME_THEME_SELECTORS.operator]: {
    color: "var(--text-accent, #0f766e)"
  }
});
