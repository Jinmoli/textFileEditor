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

    expect(result).toEqual({ content: "txt content", encoding: "utf-8" });
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

    expect(result).toEqual({ content: "sql content", encoding: "utf-8" });
    expect(vaultRead).toHaveBeenCalledTimes(1);
    expect(adapterRead).toHaveBeenCalledWith("项目/智慧农业/单通阀数据库文档V1.0_20260603.sql");
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
    const adapterReadBinary = vi.fn().mockResolvedValue(new TextEncoder().encode("binary content").buffer);

    const result = await readTextFileContent({
      path: "legacy.sql",
      vaultRead,
      adapterRead,
      adapterReadBinary,
      preferredEncoding: "utf-8"
    });

    expect(result).toEqual({ content: "binary content", encoding: "utf-8" });
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

    expect(result).toEqual({ content: "binary content", encoding: "utf-8" });
    expect(adapterReadBinary).toHaveBeenCalledWith("legacy.properties");
    expect(vaultRead).not.toHaveBeenCalled();
    expect(adapterRead).not.toHaveBeenCalled();
  });
});
