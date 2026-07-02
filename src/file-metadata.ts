export interface TextFileMetadata {
  size: number | null;
  mtime: number | null;
}

export const UNKNOWN_FILE_METADATA: TextFileMetadata = {
  size: null,
  mtime: null
};

export function formatFileSize(size: number | null): string {
  if (size === null || !Number.isFinite(size)) {
    return "大小未知";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = size / 1024;
  for (const unit of units) {
    if (value < 1024 || unit === units[units.length - 1]) {
      return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
    }
    value /= 1024;
  }

  return `${size} B`;
}

export function formatModifiedTime(mtime: number | null): string {
  if (mtime === null || !Number.isFinite(mtime)) {
    return "修改时间未知";
  }

  const date = new Date(mtime);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export function exceedsLargeFileThreshold(size: number | null, thresholdMb: number): boolean {
  if (size === null || !Number.isFinite(size) || thresholdMb <= 0) {
    return false;
  }

  return size >= thresholdMb * 1024 * 1024;
}
