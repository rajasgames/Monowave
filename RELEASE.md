# Monowave Release & Security Signing Guide

This document defines the release discipline, versioning policies, and persistent production signing strategy for Monowave.

---

## 1. Release Security & Signing Identity

Android enforces update security through cryptographic signing. If an APK is signed with a different key than a previously installed version, Android will reject the update with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.

### Core Signing Requirements

1. **Dedicated Key**: Releases must **never** be signed with Android's default `debug.keystore`.
2. **Fail-Fast Policy**: Gradle build scripts deliberately reject `assembleRelease` builds with a hard failure if production signing credentials are not configured, preventing accidental debug-signed public distributions.
3. **Never Commit Keys**: Keystores and passwords must **never** be committed to Git.
4. **Secret Injection**: GitHub Actions injects the base64-encoded production keystore securely into the build environment.

---

## 2. Generating a Persistent Release Keystore

To create a new dedicated signing key:

```bash
keytool -genkeypair -v \
  -keystore monowave-release.keystore \
  -alias monowave \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype PKCS12
```

Convert the keystore to a base64 string for CI configuration:

- **macOS / Linux**: `base64 -w 0 monowave-release.keystore > keystore_base64.txt`
- **Windows (PowerShell)**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("monowave-release.keystore")) | Out-File -Encoding ascii keystore_base64.txt
  ```

Store an encrypted offline backup of `monowave-release.keystore`. If this key is lost, existing users cannot receive automated updates.

---

## 3. GitHub Actions Secret Configuration

Configure the following secrets in GitHub Repository Settings (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name                          | Description                                          |
| ------------------------------------ | ---------------------------------------------------- |
| `MONOWAVE_RELEASE_KEYSTORE_BASE64`   | Base64-encoded string of `monowave-release.keystore` |
| `MONOWAVE_RELEASE_KEYSTORE_PASSWORD` | Password protecting the keystore file                |
| `MONOWAVE_RELEASE_KEY_ALIAS`         | Key alias (e.g. `monowave`)                          |
| `MONOWAVE_RELEASE_KEY_PASSWORD`      | Password for the key alias                           |

---

## 4. Local Release Testing

To perform a local release build without production keys (for debugging release optimizations and ProGuard rules):

```bash
cd android
./gradlew assembleRelease -PALLOW_UNSAFE_RELEASE_DEBUG_SIGNING=true
```

> **Warning**: Do not publish APKs generated with `-PALLOW_UNSAFE_RELEASE_DEBUG_SIGNING=true` to users.

---

## 5. Versioning Discipline

Every release must keep version identifiers synchronized across:

- `package.json` (`version`)
- `app.json` (`expo.version` and `expo.android.versionCode`)
- `CHANGELOG.md`
- Git release tag (`vX.Y.Z`)

### Versioning Rules:

- `version`: Semantic versioning (`MAJOR.MINOR.PATCH`).
- `versionCode`: Positive integer incremented on every release (e.g. `1`, `2`, `3`).

---

## 6. Published Artifacts

Each release published to GitHub releases contains:

1. **`monowave-universal.apk` (Recommended)**: Universal build supporting all device architectures (`arm64-v8a`, `armeabi-v7a`, `x86_64`). Recommended for end users.
2. **`monowave-arm64-v8a.apk`**: Optimized build with smaller footprint for modern 64-bit phones.
3. **`monowave-armeabi-v7a.apk`**: Smaller build for older 32-bit ARM devices.
4. **`monowave-x86_64.apk`**: Optimized for emulators and Intel/AMD Chromebooks.
5. **`SHA256SUMS.txt`**: SHA-256 cryptographic hashes for verifying binary integrity.

---

## 7. Release Step-by-Step Checklist

1. Run quality gates locally:
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm test
   npm run doctor
   ```
2. Update versions in `package.json` and `app.json`.
3. Update `CHANGELOG.md` with user-facing highlights.
4. Commit and push changes:
   ```bash
   git commit -am "chore(release): prepare v1.1.0"
   git push origin main
   ```
5. Tag the release:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```
6. The `Release APKs` GitHub Action will execute, verify signing credentials, build all APK variants, generate SHA-256 checksums, and publish the release.
