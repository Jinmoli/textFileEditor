import { isSupportedExtension, normalizeExtension } from "./extension-map";

export interface TextFileListItem {
  path: string;
  name: string;
  extension: string;
}

export function collectSupportedTextFiles(
  files: readonly TextFileListItem[],
  supportedExtensions: readonly string[]
): TextFileListItem[] {
  return files
    .filter((file) => isSupportedExtension(file.extension, supportedExtensions))
    .map((file) => ({
      path: file.path,
      name: file.name,
      extension: normalizeExtension(file.extension)
    }))
    .sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
}

export interface AdapterListResult {
  files: string[];
  folders: string[];
}

export interface ScanSupportedTextFilesOptions {
  list: (path: string) => Promise<AdapterListResult>;
  supportedExtensions: readonly string[];
  rootPath?: string;
  ignoredTopLevelFolders?: readonly string[];
}

export async function scanSupportedTextFiles(options: ScanSupportedTextFilesOptions): Promise<TextFileListItem[]> {
  const ignoredTopLevelFolders = new Set(options.ignoredTopLevelFolders ?? [".obsidian"]);
  const files: TextFileListItem[] = [];

  async function scanFolder(path: string): Promise<void> {
    const listed = await options.list(path);

    for (const filePath of listed.files) {
      const item = textFileListItemFromPath(resolveListedPath(path, filePath));
      if (item && isSupportedExtension(item.extension, options.supportedExtensions)) {
        files.push(item);
      }
    }

    for (const folderPath of listed.folders) {
      const resolvedFolderPath = resolveListedPath(path, folderPath);
      if (!path && ignoredTopLevelFolders.has(resolvedFolderPath)) {
        continue;
      }
      await scanFolder(resolvedFolderPath);
    }
  }

  await scanFolder(options.rootPath ?? "");
  return collectSupportedTextFiles(files, options.supportedExtensions);
}

function resolveListedPath(parentPath: string, listedPath: string): string {
  if (!parentPath || listedPath.startsWith(`${parentPath}/`)) {
    return listedPath;
  }
  return `${parentPath}/${listedPath}`;
}

function textFileListItemFromPath(path: string): TextFileListItem | null {
  const name = path.split("/").pop() ?? path;
  const extension = name.includes(".") ? name.split(".").pop() ?? "" : "";
  if (!extension) {
    return null;
  }

  return {
    path,
    name,
    extension: normalizeExtension(extension)
  };
}
