export type BuildProfile = "debug" | "production";

export function resolveBuildProfile(env: Record<string, string | undefined>): BuildProfile;

export function resolveBuildOptions(profile: BuildProfile): {
  minify: boolean;
  sourcemap: false | "inline";
};
