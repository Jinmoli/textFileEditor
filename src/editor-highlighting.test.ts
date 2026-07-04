import { describe, expect, it } from "vitest";
import { tags } from "@lezer/highlight";
import { HIGHLIGHT_TAGS, PROPERTIES_TOKEN_TABLE, findHighlightStyleSpec } from "./editor-highlighting";

describe("editor highlighting style", () => {
  it("assigns explicit styles for structured document names", () => {
    expect(findHighlightStyleSpec(tags.tagName)?.color).toBe("var(--color-blue)");
    expect(findHighlightStyleSpec(tags.attributeName)?.color).toBe("var(--color-orange)");
    expect(findHighlightStyleSpec(HIGHLIGHT_TAGS.definedProperty)?.color).toBe("var(--color-blue)");
  });

  it("assigns explicit styles for script definitions, variables, and labels", () => {
    expect(findHighlightStyleSpec(HIGHLIGHT_TAGS.definedVariable)?.color).toBe("var(--color-purple)");
    expect(findHighlightStyleSpec(tags.variableName)?.color).toBe("#d336ff");
    expect(findHighlightStyleSpec(HIGHLIGHT_TAGS.standardVariable)?.color).toBe("#d336ff");
  });

  it("keeps comment and keyword contrast strong", () => {
    expect(findHighlightStyleSpec(tags.comment)?.fontStyle).toBe("italic");
    expect(findHighlightStyleSpec(tags.comment)?.color).toBe("var(--color-green)");
    expect(findHighlightStyleSpec(tags.keyword)?.color).toBe("var(--color-purple)");
  });

  it("maps properties keys to property-definition tags", () => {
    expect(PROPERTIES_TOKEN_TABLE.def).toBe(HIGHLIGHT_TAGS.definedProperty);
  });
});
