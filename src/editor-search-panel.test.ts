import { describe, expect, it } from "vitest";
import { buildTextFileSearchQuery, TEXT_FILE_SEARCH_PANEL_CLASSNAMES } from "./editor-search-panel";

describe("editor search panel helpers", () => {
  it("builds a search query from form state", () => {
    const query = buildTextFileSearchQuery({
      search: "foo",
      replace: "bar",
      caseSensitive: true,
      regexp: false,
      wholeWord: true
    });

    expect(query.search).toBe("foo");
    expect(query.replace).toBe("bar");
    expect(query.caseSensitive).toBe(true);
    expect(query.wholeWord).toBe(true);
  });

  it("defines dedicated classes for a two-row search panel layout", () => {
    expect(TEXT_FILE_SEARCH_PANEL_CLASSNAMES.root).toContain("search-panel");
    expect(TEXT_FILE_SEARCH_PANEL_CLASSNAMES.rowPrimary).toContain("primary");
    expect(TEXT_FILE_SEARCH_PANEL_CLASSNAMES.rowSecondary).toContain("secondary");
    expect(TEXT_FILE_SEARCH_PANEL_CLASSNAMES.close).toContain("close");
  });
});
