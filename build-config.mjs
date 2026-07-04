export function resolveBuildProfile(env) {
  return env.TEXT_FILE_EDITOR_BUILD_DEBUG === "1" ? "debug" : "production";
}

export function resolveBuildOptions(profile) {
  if (profile === "debug") {
    return {
      minify: false,
      sourcemap: "inline"
    };
  }

  return {
    minify: true,
    sourcemap: false
  };
}
