import { describe, expect, it } from "vitest";
import { collectLegacyHighlightSpans, shouldRebuildLegacyHighlight } from "./legacy-highlight-fallback";

describe("legacy highlight fallback", () => {
  it("highlights properties keys and comments with explicit token classes", () => {
    const spans = collectLegacyHighlightSpans("properties", "server.port=8080\n# note\n");

    expect(spans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: "server.port", classes: "tok-propertyName tok-definition" }),
        expect.objectContaining({ text: "# note", classes: "tok-comment" })
      ])
    );
  });

  it("highlights shell comments, keywords, variables, and operators with explicit token classes", () => {
    const spans = collectLegacyHighlightSpans("shell", "#!/bin/sh\nif [ -n $PRG ]; then\n");

    expect(spans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: "#!/bin/sh", classes: "tok-comment" }),
        expect.objectContaining({ text: "if", classes: "tok-keyword" }),
        expect.objectContaining({ text: "$PRG", classes: "tok-variableName" }),
        expect.objectContaining({ text: "[", classes: "tok-operator" })
      ])
    );
  });

  it("highlights batch comments, labels, keywords, and variables with explicit token classes", () => {
    const spans = collectLegacyHighlightSpans("batch", "rem hello\nif exist %A% goto done\n:done\n");

    expect(spans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: "rem hello", classes: "tok-comment" }),
        expect.objectContaining({ text: "if", classes: "tok-keyword" }),
        expect.objectContaining({ text: "%A%", classes: "tok-variableName" }),
        expect.objectContaining({ text: ":done", classes: "tok-variableName tok-definition" })
      ])
    );
  });

  it("only rebuilds fallback decorations when the document changes", () => {
    expect(shouldRebuildLegacyHighlight({ docChanged: true })).toBe(true);
    expect(shouldRebuildLegacyHighlight({ docChanged: false })).toBe(false);
  });
});
