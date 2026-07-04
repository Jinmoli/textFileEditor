import { describe, expect, it, vi } from "vitest";
import { openEditorSearchPanel } from "./editor-search";

describe("editor search helpers", () => {
  it("opens the search panel without moving focus back to the editor", () => {
    const editor = {
      focus: vi.fn()
    };
    const openPanel = vi.fn();

    openEditorSearchPanel(editor as never, openPanel);

    expect(openPanel).toHaveBeenCalledOnce();
    expect(openPanel).toHaveBeenCalledWith(editor);
    expect(editor.focus).not.toHaveBeenCalled();
  });
});
