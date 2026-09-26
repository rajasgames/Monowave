# Release Process

To create a new release for Monowave:

1. **Version Bump:** Update the `version` and `android.versionCode` in `app.json` and `package.json`.
2. **Integrity Checks:** Run `npm run test`, `npm run typecheck`, and `npm run doctor` to ensure the codebase is stable.
3. **Build:** Use EAS Build or `npm run export:android` to compile a signed `.aab` (Android App Bundle).
4. **Smoke Test:** Generate a universal `.apk` from the `.aab` and install it on a test device to verify background playback and UI.
5. **Publish:** Create a GitHub Release, attach the `.apk` and `.aab`, generate checksums, and include the updated `CHANGELOG.md` notes.
