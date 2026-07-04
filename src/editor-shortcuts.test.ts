import { describe, expect, it } from "vitest";
import { getEditorShortcutAction, shouldHandleEditorShortcutEvent } from "./editor-shortcuts";

describe("editor shortcut helpers", () => {
  it("recognizes the save shortcut", () => {
    expect(getEditorShortcutAction(createKeyboardEventLike("s", { ctrlKey: true }))).toBe("save");
  });

  it("recognizes the find shortcut", () => {
    expect(getEditorShortcutAction(createKeyboardEventLike("f", { ctrlKey: true }))).toBe("find");
  });

  it("ignores unrelated or modified shortcuts", () => {
    expect(getEditorShortcutAction(createKeyboardEventLike("f", { ctrlKey: true, altKey: true }))).toBeNull();
    expect(getEditorShortcutAction(createKeyboardEventLike("k", { ctrlKey: true }))).toBeNull();
  });

  it("only handles shortcuts when the active editor actually owns the event target", () => {
    expect(shouldHandleEditorShortcutEvent(true, true)).toBe(true);
    expect(shouldHandleEditorShortcutEvent(true, false)).toBe(false);
    expect(shouldHandleEditorShortcutEvent(false, true)).toBe(false);
  });
});

function createKeyboardEventLike(
  key: string,
  options: {
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
  } = {}
): KeyboardEvent {
  return {
    key,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    altKey: options.altKey ?? false
  } as KeyboardEvent;
}
