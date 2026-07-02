import { decodeTextContent, type DecodedTextContent, type TextFileEncoding } from "./text-encoding";

export interface TextFileReader {
  path: string;
  name?: string;
}

export interface ReadTextFileContentOptions extends TextFileReader {
  vaultRead: () => Promise<string>;
  adapterRead: (path: string) => Promise<string>;
  adapterReadBinary?: (path: string) => Promise<ArrayBuffer>;
  preferredEncoding?: TextFileEncoding;
}

export async function readTextFileContent(options: ReadTextFileContentOptions): Promise<DecodedTextContent> {
  try {
    return {
      content: await options.vaultRead(),
      encoding: "utf-8"
    };
  } catch (vaultError) {
    if (options.adapterReadBinary) {
      try {
        return decodeTextContent(await options.adapterReadBinary(options.path), options.preferredEncoding ?? "auto");
      } catch (binaryError) {
        console.warn("Text File Editor：二进制方式读取失败，尝试使用文本方式读取。", binaryError);
      }
    }

    try {
      return {
        content: await options.adapterRead(options.path),
        encoding: "utf-8"
      };
    } catch (adapterError) {
      const fileName = options.name ?? options.path;
      const error = new Error(`无法读取文件“${fileName}”。请确认文件仍存在且 Obsidian 有访问权限。`);
      (error as Error & { cause?: unknown }).cause = adapterError instanceof Error ? adapterError : vaultError;
      throw error;
    }
  }
}
