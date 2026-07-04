import { describe, expect, it, vi } from "vitest";
import { readTextFileContent } from "./file-content";

describe("readTextFileContent", () => {
  it("calls the primary vault reader without a synthetic file object", async () => {
    const vaultRead = vi.fn().mockResolvedValue("txt content");
    const adapterRead = vi.fn().mockResolvedValue("fallback content");

    const result = await readTextFileContent({
      path: "项目/智慧农业/单通阀门控制接口.txt",
      name: "单通阀门控制接口.txt",
      vaultRead,
      adapterRead
    });

    expect(result).toEqual({ content: "txt content", encoding: "utf-8", lineEnding: "unknown" });
    expect(vaultRead).toHaveBeenCalledWith();
    expect(adapterRead).not.toHaveBeenCalled();
  });

  it("uses adapter.read when vault.read fails", async () => {
    const vaultRead = vi.fn().mockRejectedValue(new Error("vault read failed"));
    const adapterRead = vi.fn().mockResolvedValue("sql content");

    const result = await readTextFileContent({
      path: "项目/智慧农业/单通阀数据库文档V1.0_20260603.sql",
      vaultRead,
      adapterRead
    });

    expect(result).toEqual({ content: "sql content", encoding: "utf-8", lineEnding: "unknown" });
    expect(vaultRead).toHaveBeenCalledTimes(1);
    expect(adapterRead).toHaveBeenCalledWith("项目/智慧农业/单通阀数据库文档V1.0_20260603.sql");
  });

  it("returns raw content plus fidelity metadata for text files", async () => {
    const vaultRead = vi.fn().mockResolvedValue("first\r\nsecond\r\n");
    const adapterRead = vi.fn().mockResolvedValue("fallback");

    const result = await readTextFileContent({
      path: "notes/demo.txt",
      vaultRead,
      adapterRead
    });

    expect(result.content).toBe("first\r\nsecond\r\n");
    expect(result.encoding).toBe("utf-8");
    expect(result.lineEnding).toBe("crlf");
  });

  it("throws a descriptive error when both readers fail", async () => {
    const vaultRead = vi.fn().mockRejectedValue(new Error("vault read failed"));
    const adapterRead = vi.fn().mockRejectedValue(new Error("adapter read failed"));

    await expect(
      readTextFileContent({
        path: "项目/智慧农业/单通阀门控制接口.txt",
        vaultRead,
        adapterRead
      })
    ).rejects.toThrow("无法读取文件“项目/智慧农业/单通阀门控制接口.txt”");
  });

  it("uses binary adapter read with the preferred encoding before text fallback", async () => {
    const vaultRead = vi.fn().mockRejectedValue(new Error("vault read failed"));
    const adapterRead = vi.fn().mockResolvedValue("fallback content");
    const adapterReadBinary = vi.fn().mockResolvedValue(new TextEncoder().encode("binary\r\ncontent\r\n").buffer);

    const result = await readTextFileContent({
      path: "legacy.sql",
      vaultRead,
      adapterRead,
      adapterReadBinary,
      preferredEncoding: "utf-8"
    });

    expect(result).toEqual({ content: "binary\r\ncontent\r\n", encoding: "utf-8", lineEnding: "crlf" });
    expect(adapterReadBinary).toHaveBeenCalledWith("legacy.sql");
    expect(adapterRead).not.toHaveBeenCalled();
  });

  it("uses binary adapter read first when a concrete encoding is requested", async () => {
    const vaultRead = vi.fn().mockResolvedValue("vault content");
    const adapterRead = vi.fn().mockResolvedValue("fallback content");
    const adapterReadBinary = vi.fn().mockResolvedValue(new TextEncoder().encode("binary content").buffer);

    const result = await readTextFileContent({
      path: "legacy.properties",
      vaultRead,
      adapterRead,
      adapterReadBinary,
      preferredEncoding: "utf-8"
    });

    expect(result).toEqual({ content: "binary content", encoding: "utf-8", lineEnding: "unknown" });
    expect(adapterReadBinary).toHaveBeenCalledWith("legacy.properties");
    expect(vaultRead).not.toHaveBeenCalled();
    expect(adapterRead).not.toHaveBeenCalled();
  });

  it("prefers binary auto-detection when binary reads are available", async () => {
    const vaultRead = vi.fn().mockResolvedValue("garbled content");
    const adapterRead = vi.fn().mockResolvedValue("fallback content");
    const adapterReadBinary = vi.fn().mockResolvedValue(new Uint8Array([0xd6, 0xd0, 0xce, 0xc4]).buffer);

    const result = await readTextFileContent({
      path: "legacy-gbk.sql",
      vaultRead,
      adapterRead,
      adapterReadBinary,
      preferredEncoding: "auto"
    });

    expect(result).toEqual({ content: "garbled content", encoding: "utf-8", lineEnding: "unknown" });
    expect(adapterReadBinary).not.toHaveBeenCalled();
    expect(vaultRead).toHaveBeenCalledTimes(1);
    expect(adapterRead).not.toHaveBeenCalled();
  });
});
