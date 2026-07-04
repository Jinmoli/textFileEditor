import { openSearchPanel } from "@codemirror/search";
import type { EditorView } from "@codemirror/view";

export function openEditorSearchPanel(
  editor: EditorView,
  openPanel: (editor: EditorView) => boolean = openSearchPanel
): boolean {
  return openPanel(editor);
}
