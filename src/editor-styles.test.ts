import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("editor stylesheet fallbacks", () => {
  it("styles legacy stream tokens explicitly inside the text editor host", () => {
    const styles = readFileSync(join(process.cwd(), "styles.css"), "utf8");

    expect(styles).toContain(".text-file-editor__host .text-file-editor__search-panel");
    expect(styles).toContain(".text-file-editor__host .text-file-editor__search-row--primary");
    expect(styles).toContain(".text-file-editor__host .text-file-editor__search-close");
    expect(styles).toContain(".text-file-editor__host .tok-comment");
    expect(styles).toContain(".text-file-editor__host .tok-keyword");
    expect(styles).toContain(".text-file-editor__host .tok-variableName");
    expect(styles).toContain(".text-file-editor__host .tok-propertyName");
    expect(styles).toContain(".text-file-editor__host .tok-variableName.tok-definition");
    expect(styles).toContain(".text-file-editor__host .tok-propertyName.tok-definition");
    expect(styles).toContain('.text-file-editor__host .cm-search input[type="text"]');
    expect(styles).toContain('.text-file-editor__host .cm-search input[type="checkbox"]');
    expect(styles).toContain(".text-file-editor__host .cm-search br");
    expect(styles).toContain('.text-file-editor__host .cm-search input[name="replace"]');
    expect(styles).toContain('.text-file-editor__host .cm-search button[name="close"]');
  });

  it("uses a restrained accent treatment for active toolbar state buttons", () => {
    const styles = readFileSync(join(process.cwd(), "styles.css"), "utf8");

    expect(styles).toContain(".text-file-editor__button.is-active");
    expect(styles).toContain("background: color-mix(in srgb, var(--interactive-accent) 14%, var(--background-primary));");
    expect(styles).toContain(
      "border-color: color-mix(in srgb, var(--interactive-accent) 55%, var(--background-modifier-border));"
    );
    expect(styles).toContain("color: color-mix(in srgb, var(--interactive-accent) 82%, var(--text-normal));");
    expect(styles).toContain(".text-file-editor__button.is-active:hover");
    expect(styles).not.toContain("background: var(--background-modifier-success);");
  });
});
