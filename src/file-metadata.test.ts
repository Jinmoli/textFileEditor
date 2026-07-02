import { describe, expect, it } from "vitest";
import { exceedsLargeFileThreshold, formatFileSize, formatModifiedTime } from "./file-metadata";

describe("file metadata helpers", () => {
  it("formats file sizes for status display", () => {
    expect(formatFileSize(null)).toBe("大小未知");
    expect(formatFileSize(12)).toBe("12 B");
    expect(formatFileSize(1536)).toBe("1.50 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.00 MB");
  });

  it("formats modified times without ISO T separators", () => {
    expect(formatModifiedTime(Date.UTC(2026, 6, 2, 8, 9))).toBe("2026-07-02 16:09");
  });

  it("detects files that exceed the configured large file threshold", () => {
    expect(exceedsLargeFileThreshold(6 * 1024 * 1024, 5)).toBe(true);
    expect(exceedsLargeFileThreshold(4 * 1024 * 1024, 5)).toBe(false);
    expect(exceedsLargeFileThreshold(null, 5)).toBe(false);
  });
});
