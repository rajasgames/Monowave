const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = config => withAppBuildGradle(config, context => {
  const original = context.modResults.contents;
  let output = original;
  if (!output.includes('coreLibraryDesugaringEnabled true')) {
    output = output.replace(/android\s*\{/, match => `${match}\n    compileOptions { coreLibraryDesugaringEnabled true }`);
  }
  if (!output.includes('coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.1.5"')) {
    output = output.replace(/dependencies\s*\{/, match => `${match}\n    coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.1.5"`);
  }
  if (!output.includes('coreLibraryDesugaringEnabled true') || !output.includes('desugar_jdk_libs')) {
    throw new Error('Unable to enable Android core library desugaring');
  }
  context.modResults.contents = output;
  return context;
});
