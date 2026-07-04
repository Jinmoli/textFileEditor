import { describe, expect, it } from "vitest";
import { EDITOR_ZH_CN_PHRASES } from "./editor-localization";

describe("editor localization", () => {
  it("provides chinese phrases for the search panel", () => {
    expect(EDITOR_ZH_CN_PHRASES.Find).toBe("查找");
    expect(EDITOR_ZH_CN_PHRASES.Replace).toBe("替换");
    expect(EDITOR_ZH_CN_PHRASES.next).toBe("下一个");
    expect(EDITOR_ZH_CN_PHRASES.previous).toBe("上一个");
    expect(EDITOR_ZH_CN_PHRASES["replace all"]).toBe("全部替换");
    expect(EDITOR_ZH_CN_PHRASES["current match"]).toBe("当前匹配");
    expect(EDITOR_ZH_CN_PHRASES["replaced $ matches"]).toBe("已替换 $ 处匹配");
  });
});
