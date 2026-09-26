const { withProjectBuildGradle } = require("expo/config-plugins");

/** The NewPipeExtractor artifact is served by JitPack. Reapply on prebuild. */
function addJitPack(contents) {
  if (/https:\/\/(?:www\.)?jitpack\.io\b/.test(contents)) return contents;

  const updated = contents.replace(
    /(allprojects\s*\{\s*repositories\s*\{)/,
    "$1\n        maven { url 'https://jitpack.io' }",
  );

  if (updated === contents) {
    throw new Error(
      "withJitPack: could not locate allprojects repositories in android/build.gradle",
    );
  }
  return updated;
}

module.exports = function withJitPack(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error(
        `withJitPack: expected Groovy build.gradle, got ${cfg.modResults.language}`,
      );
    }
    cfg.modResults.contents = addJitPack(cfg.modResults.contents);
    return cfg;
  });
};

module.exports.addJitPack = addJitPack;
