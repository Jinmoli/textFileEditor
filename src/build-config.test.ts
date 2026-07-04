import { describe, expect, it } from "vitest";
import { resolveBuildOptions, resolveBuildProfile } from "../build-config.mjs";

describe("build config helpers", () => {
  it("uses the production profile by default", () => {
    expect(resolveBuildProfile({})).toBe("production");
  });

  it("switches to debug profile when the environment flag is enabled", () => {
    expect(resolveBuildProfile({ TEXT_FILE_EDITOR_BUILD_DEBUG: "1" })).toBe("debug");
  });

  it("minifies production builds and disables inline sourcemaps", () => {
    expect(resolveBuildOptions("production")).toEqual({
      minify: true,
      sourcemap: false
    });
  });

  it("keeps debug builds readable with inline sourcemaps", () => {
    expect(resolveBuildOptions("debug")).toEqual({
      minify: false,
      sourcemap: "inline"
    });
  });
});
