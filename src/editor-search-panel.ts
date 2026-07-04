import {
  SearchQuery,
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  selectMatches,
  setSearchQuery
} from "@codemirror/search";
import type { EditorView, Panel, ViewUpdate } from "@codemirror/view";

export const TEXT_FILE_SEARCH_PANEL_CLASSNAMES = {
  root: "text-file-editor__search-panel",
  row: "text-file-editor__search-row",
  rowPrimary: "text-file-editor__search-row--primary",
  rowSecondary: "text-file-editor__search-row--secondary",
  input: "text-file-editor__search-input",
  replaceInput: "text-file-editor__search-input--replace",
  button: "text-file-editor__search-button",
  option: "text-file-editor__search-option",
  close: "text-file-editor__search-close"
} as const;

export interface TextFileSearchFormState {
  caseSensitive: boolean;
  regexp: boolean;
  replace: string;
  search: string;
  wholeWord: boolean;
}

export function buildTextFileSearchQuery(state: TextFileSearchFormState): SearchQuery {
  return new SearchQuery({
    search: state.search,
    replace: state.replace,
    caseSensitive: state.caseSensitive,
    regexp: state.regexp,
    wholeWord: state.wholeWord
  });
}

export function createTextFileSearchPanel(view: EditorView): Panel {
  return new TextFileSearchPanel(view);
}

class TextFileSearchPanel implements Panel {
  readonly dom: HTMLElement;
  readonly top = true;

  private readonly searchInput: HTMLInputElement;
  private readonly replaceInput: HTMLInputElement;
  private readonly caseCheckbox: HTMLInputElement;
  private readonly regexpCheckbox: HTMLInputElement;
  private readonly wholeWordCheckbox: HTMLInputElement;
  private query: SearchQuery;

  constructor(private readonly view: EditorView) {
    this.query = getSearchQuery(view.state);

    this.searchInput = this.createTextInput(view.state.phrase("Find"), true);
    this.replaceInput = this.createTextInput(view.state.phrase("Replace"), false);
    this.replaceInput.classList.add(TEXT_FILE_SEARCH_PANEL_CLASSNAMES.replaceInput);
    this.caseCheckbox = this.createCheckbox(this.query.caseSensitive);
    this.regexpCheckbox = this.createCheckbox(this.query.regexp);
    this.wholeWordCheckbox = this.createCheckbox(this.query.wholeWord);

    this.syncInputsFromQuery(this.query);

    const primaryRow = document.createElement("div");
    primaryRow.className = `${TEXT_FILE_SEARCH_PANEL_CLASSNAMES.row} ${TEXT_FILE_SEARCH_PANEL_CLASSNAMES.rowPrimary}`;
    primaryRow.append(
      this.searchInput,
      this.createButton(view.state.phrase("next"), () => this.runCommand(findNext)),
      this.createButton(view.state.phrase("previous"), () => this.runCommand(findPrevious)),
      this.createButton(view.state.phrase("all"), () => this.runCommand(selectMatches)),
      this.createCheckboxLabel(view.state.phrase("match case"), this.caseCheckbox),
      this.createCheckboxLabel(view.state.phrase("regexp"), this.regexpCheckbox),
      this.createCheckboxLabel(view.state.phrase("by word"), this.wholeWordCheckbox),
      this.createCloseButton(view.state.phrase("close"))
    );

    const secondaryRow = document.createElement("div");
    secondaryRow.className = `${TEXT_FILE_SEARCH_PANEL_CLASSNAMES.row} ${TEXT_FILE_SEARCH_PANEL_CLASSNAMES.rowSecondary}`;
    secondaryRow.append(
      this.replaceInput,
      this.createButton(view.state.phrase("replace"), () => this.runCommand(replaceNext)),
      this.createButton(view.state.phrase("replace all"), () => this.runCommand(replaceAll))
    );

    this.dom = document.createElement("div");
    this.dom.className = TEXT_FILE_SEARCH_PANEL_CLASSNAMES.root;
    this.dom.append(primaryRow, secondaryRow);
  }

  mount(): void {
    this.focusSearchInput();
  }

  update(update: ViewUpdate): void {
    const nextQuery = getSearchQuery(update.state);
    if (!nextQuery.eq(this.query)) {
      this.query = nextQuery;
      this.syncInputsFromQuery(nextQuery);
    }
  }

  private createTextInput(placeholder: string, isMainField: boolean): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.ariaLabel = placeholder;
    input.className = TEXT_FILE_SEARCH_PANEL_CLASSNAMES.input;
    input.addEventListener("input", () => this.commitQuery());
    input.addEventListener("keydown", (event) => this.handleInputKeydown(event, input === this.replaceInput));
    if (isMainField) {
      input.setAttribute("main-field", "true");
    }
    return input;
  }

  private createCheckbox(checked: boolean): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", () => this.commitQuery());
    return input;
  }

  private createCheckboxLabel(text: string, checkbox: HTMLInputElement): HTMLLabelElement {
    const label = document.createElement("label");
    label.className = TEXT_FILE_SEARCH_PANEL_CLASSNAMES.option;
    label.append(checkbox, document.createTextNode(text));
    return label;
  }

  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = TEXT_FILE_SEARCH_PANEL_CLASSNAMES.button;
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }

  private createCloseButton(label: string): HTMLButtonElement {
    const button = this.createButton("×", () => {
      closeSearchPanel(this.view);
    });
    button.ariaLabel = label;
    button.classList.add(TEXT_FILE_SEARCH_PANEL_CLASSNAMES.close);
    return button;
  }

  private handleInputKeydown(event: KeyboardEvent, isReplaceInput: boolean): void {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearchPanel(this.view);
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    if (isReplaceInput) {
      this.runCommand(replaceNext);
      return;
    }
    this.runCommand(event.shiftKey ? findPrevious : findNext);
  }

  private runCommand(command: (view: EditorView) => boolean): void {
    this.commitQuery();
    command(this.view);
    this.focusSearchInput();
  }

  private commitQuery(): void {
    const nextQuery = buildTextFileSearchQuery({
      search: this.searchInput.value,
      replace: this.replaceInput.value,
      caseSensitive: this.caseCheckbox.checked,
      regexp: this.regexpCheckbox.checked,
      wholeWord: this.wholeWordCheckbox.checked
    });
    if (nextQuery.eq(this.query)) {
      return;
    }
    this.query = nextQuery;
    this.view.dispatch({
      effects: setSearchQuery.of(nextQuery)
    });
  }

  private syncInputsFromQuery(query: SearchQuery): void {
    this.searchInput.value = query.search;
    this.replaceInput.value = query.replace;
    this.caseCheckbox.checked = query.caseSensitive;
    this.regexpCheckbox.checked = query.regexp;
    this.wholeWordCheckbox.checked = query.wholeWord;
  }

  private focusSearchInput(): void {
    this.searchInput.focus();
    this.searchInput.select();
  }
}
