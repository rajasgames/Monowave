const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Ensures release builds use a dedicated production keystore and never
 * silently fall back to Android's default debug keystore unless explicitly
 * bypassed for local test builds (-PALLOW_UNSAFE_RELEASE_DEBUG_SIGNING=true).
 */
function applyReleaseSigning(contents) {
  if (contents.includes("MONOWAVE_RELEASE_KEYSTORE_PATH")) {
    return contents;
  }

  const signingBlock = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (System.getenv("MONOWAVE_RELEASE_KEYSTORE_PATH")) {
                storeFile file(System.getenv("MONOWAVE_RELEASE_KEYSTORE_PATH"))
                storePassword System.getenv("MONOWAVE_RELEASE_KEYSTORE_PASSWORD")
                keyAlias System.getenv("MONOWAVE_RELEASE_KEY_ALIAS")
                keyPassword System.getenv("MONOWAVE_RELEASE_KEY_PASSWORD")
            } else if (project.hasProperty('MONOWAVE_RELEASE_STORE_FILE')) {
                storeFile file(MONOWAVE_RELEASE_STORE_FILE)
                storePassword MONOWAVE_RELEASE_STORE_PASSWORD
                keyAlias MONOWAVE_RELEASE_KEY_ALIAS
                keyPassword MONOWAVE_RELEASE_KEY_PASSWORD
            } else if (gradle.startParameter.taskNames.any { it.toLowerCase().contains("release") } && !findProperty("ALLOW_UNSAFE_RELEASE_DEBUG_SIGNING")) {
                throw new GradleException(
                    "CRITICAL: Release build aborted. Dedicated Monowave signing credentials are required! " +
                    "Set MONOWAVE_RELEASE_KEYSTORE_PATH env var or configure MONOWAVE_RELEASE_STORE_FILE in gradle.properties. " +
                    "Pass -PALLOW_UNSAFE_RELEASE_DEBUG_SIGNING=true only for temporary local test builds."
                )
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }
    }`;

  let updated = contents.replace(
    /signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\}\s*\}/m,
    signingBlock,
  );

  updated = updated.replace(
    /release\s*\{\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*signingConfig\s+signingConfigs\.debug/,
    "release {\n            signingConfig signingConfigs.release",
  );

  if (!updated.includes("signingConfig signingConfigs.release")) {
    updated = updated.replace(
      /signingConfig\s+signingConfigs\.debug(\s*\n\s*def\s+enableShrinkResources)/,
      "signingConfig signingConfigs.release$1",
    );
  }

  return updated;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error(
        `withReleaseSigning: expected Groovy build.gradle, got ${cfg.modResults.language}`,
      );
    }
    cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
};

module.exports.applyReleaseSigning = applyReleaseSigning;
