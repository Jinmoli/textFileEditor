export interface TextFileReader {
  path: string;
  name?: string;
}

export interface ReadTextFileContentOptions extends TextFileReader {
  vaultRead: (file: TextFileReader) => Promise<string>;
  adapterRead: (path: string) => Promise<string>;
}

export async function readTextFileContent(options: ReadTextFileContentOptions): Promise<string> {
  try {
    return await options.vaultRead(options);
  } catch (vaultError) {
    try {
      return await options.adapterRead(options.path);
    } catch (adapterError) {
      const fileName = options.name ?? options.path;
      const error = new Error(`无法读取文件“${fileName}”。请确认文件仍存在且 Obsidian 有访问权限。`);
      (error as Error & { cause?: unknown }).cause = adapterError instanceof Error ? adapterError : vaultError;
      throw error;
    }
  }
}
