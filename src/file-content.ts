import { decodeTextContent, type DecodedTextContent, type TextFileEncoding } from "./text-encoding";
import { detectLineEnding } from "./file-fidelity";

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
  const preferredEncoding = options.preferredEncoding ?? "auto";
  if (preferredEncoding !== "auto" && options.adapterReadBinary) {
    try {
      const decoded = decodeTextContent(await options.adapterReadBinary(options.path), preferredEncoding);
      return {
        ...decoded,
        lineEnding: detectLineEnding(decoded.content)
      };
    } catch (binaryError) {
      console.warn("Text File Editor：指定编码读取失败，尝试使用 Obsidian 文本方式读取。", binaryError);
    }
  }

  try {
    const content = await options.vaultRead();
    return {
      content,
      encoding: "utf-8",
      lineEnding: detectLineEnding(content)
    };
  } catch (vaultError) {
    if (options.adapterReadBinary) {
      try {
        const decoded = decodeTextContent(await options.adapterReadBinary(options.path), preferredEncoding);
        return {
          ...decoded,
          lineEnding: detectLineEnding(decoded.content)
        };
      } catch (binaryError) {
        console.warn("Text File Editor：二进制方式读取失败，尝试使用文本方式读取。", binaryError);
      }
    }

    try {
      const content = await options.adapterRead(options.path);
      return {
        content,
        encoding: "utf-8",
        lineEnding: detectLineEnding(content)
      };
    } catch (adapterError) {
      const fileName = options.name ?? options.path;
      const error = new Error(`无法读取文件“${fileName}”。请确认文件仍存在且 Obsidian 有访问权限。`);
      (error as Error & { cause?: unknown }).cause = adapterError instanceof Error ? adapterError : vaultError;
      throw error;
    }
  }
}
