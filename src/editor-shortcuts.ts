export type EditorShortcutAction = "find" | "save";

export function getEditorShortcutAction(event: Pick<KeyboardEvent, "altKey" | "ctrlKey" | "key" | "metaKey">): EditorShortcutAction | null {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) {
    return null;
  }

  switch (event.key.toLowerCase()) {
    case "f":
      return "find";
    case "s":
      return "save";
    default:
      return null;
  }
}

export function shouldHandleEditorShortcutEvent(isActiveView: boolean, targetInsideEditor: boolean): boolean {
  return isActiveView && targetInsideEditor;
}
