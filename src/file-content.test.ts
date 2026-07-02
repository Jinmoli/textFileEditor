import { describe, expect, it, vi } from "vitest";
import { readTextFileContent } from "./file-content";

describe("readTextFileContent", () => {
  it("uses adapter.read when vault.read fails", async () => {
    const vaultRead = vi.fn().mockRejectedValue(new Error("vault read failed"));
    const adapterRead = vi.fn().mockResolvedValue("sql content");

    const content = await readTextFileContent({
      path: "项目/智慧农业/单通阀数据库文档V1.0_20260603.sql",
      vaultRead,
      adapterRead
    });

    expect(content).toBe("sql content");
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
});
