import { describe, expect, it } from "vitest";
import { collectSupportedTextFiles, scanSupportedTextFiles } from "./text-file-list-core";

describe("collectSupportedTextFiles", () => {
  it("returns supported text files including sql files in path order", () => {
    const files = [
      { path: "项目/智慧农业/单通阀门控制接口.md", name: "单通阀门控制接口.md", extension: "md" },
      { path: "项目/智慧农业/单通阀门轮灌计划接口.txt", name: "单通阀门轮灌计划接口.txt", extension: "txt" },
      { path: "项目/智慧农业/单通阀数据库文档V1.0_20260603.sql", name: "单通阀数据库文档V1.0_20260603.sql", extension: "sql" },
      { path: "项目/智慧农业/接口修改_20260702_1.txt", name: "接口修改_20260702_1.txt", extension: "txt" }
    ];

    expect(collectSupportedTextFiles(files, ["txt", "sql"])).toEqual([
      {
        path: "项目/智慧农业/单通阀数据库文档V1.0_20260603.sql",
        name: "单通阀数据库文档V1.0_20260603.sql",
        extension: "sql"
      },
      {
        path: "项目/智慧农业/单通阀门轮灌计划接口.txt",
        name: "单通阀门轮灌计划接口.txt",
        extension: "txt"
      },
      {
        path: "项目/智慧农业/接口修改_20260702_1.txt",
        name: "接口修改_20260702_1.txt",
        extension: "txt"
      }
    ]);
  });

  it("scans adapter files recursively and skips the Obsidian config folder", async () => {
    const listedFolders: Record<string, { files: string[]; folders: string[] }> = {
      "": {
        files: [],
        folders: ["项目", ".obsidian"]
      },
      "项目": {
        files: [],
        folders: ["智慧农业"]
      },
      "项目/智慧农业": {
        files: [
          "项目/智慧农业/单通阀门控制接口.txt",
          "项目/智慧农业/单通阀数据库文档V1.0_20260603.sql",
          "项目/智慧农业/接口修改_20260702_1.md"
        ],
        folders: []
      }
    };

    const files = await scanSupportedTextFiles({
      list: async (path) => listedFolders[path] ?? { files: ["manifest.json"], folders: [] },
      supportedExtensions: ["txt", "sql", "json"]
    });

    expect(files).toEqual([
      {
        path: "项目/智慧农业/单通阀数据库文档V1.0_20260603.sql",
        name: "单通阀数据库文档V1.0_20260603.sql",
        extension: "sql"
      },
      {
        path: "项目/智慧农业/单通阀门控制接口.txt",
        name: "单通阀门控制接口.txt",
        extension: "txt"
      }
    ]);
  });
});
