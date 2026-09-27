# Monowave Troubleshooting Guide

This guide covers common developer setup issues, build errors, and runtime diagnostics for Monowave.

---

## 1. Playback & Streaming

### "Track Unavailable" or Playback Stalls

- **Cause**: Upstream audio stream URL expired, video is geo-restricted, or removed.
- **Resolution**:
  - Monowave includes automatic 1-time retry with cache invalidation for expired streams. If a track fails repeatedly, verify internet connectivity.
  - Some videos (e.g. age-restricted content or region-locked music videos) cannot be extracted without an account. Monowave displays a structured error explaining the restriction rather than crashing.

### Background Playback Stops Unexpectedly

- **Cause**: Aggressive Android battery optimization killing the foreground service.
- **Resolution**:
  - On your Android device, go to **Settings** → **Apps** → **Monowave** → **Battery**.
  - Select **Unrestricted** (or disable "Battery optimization" for Monowave).
  - Ensure the notification lock-screen controls remain enabled.

---

## 2. Android Build & Gradle

### "CRITICAL: Release build aborted. Dedicated Monowave signing credentials are required!"

- **Cause**: Running `assembleRelease` without configuring production keystore environment variables.
- **Resolution**:
  - For local test builds, pass `-PALLOW_UNSAFE_RELEASE_DEBUG_SIGNING=true`:
    ```bash
    cd android
    ./gradlew assembleRelease -PALLOW_UNSAFE_RELEASE_DEBUG_SIGNING=true
    ```
  - For production builds, configure `MONOWAVE_RELEASE_KEYSTORE_PATH` and related environment variables as described in `RELEASE.md`.

### Gradle Daemon File Lock on Windows (`buildOutputCleanup.lock`)

- **Cause**: Background Gradle daemons holding file handles open in `.gradle/`.
- **Resolution**:
  - Stop running daemons:
    ```powershell
    cd android
    .\gradlew.bat --stop
    ```
  - If locked processes remain, terminate them via PowerShell:
    ```powershell
    Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
    ```

### Missing Android SDK (`sdk.dir missing`)

- **Cause**: `local.properties` is missing or does not specify the SDK location.
- **Resolution**:
  - Create `android/local.properties` containing:
    - **Windows**: `sdk.dir=C:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk`
    - **macOS / Linux**: `sdk.dir=/Users/<YourUsername>/Library/Android/sdk`

---

## 3. Storage & Corrupted Data

### App Startup Crash After Storage Corruption

- **Resolution**:
  - Monowave's storage layer runs defensive schema validation with automated migrations and fallback defaults (`src/storage/migrations.ts`).
  - If storage contains invalid JSON, Monowave logs a diagnostic warning and initializes with clean initial state rather than crashing.
  - To manually reset all data on-device: go to **Settings** → **Storage & Data** → **Reset App Data**.

---

## 4. Code Quality & Prebuild Verification

### Checking All Quality Gates

To quickly verify your local environment:

```bash
# 1. Typecheck
npm run typecheck

# 2. Linting
npm run lint

# 3. Code formatting
npm run format:check

# 4. Unit tests
npm test

# 5. Expo doctor
npm run doctor

# 6. Native module verification
npm run check:native:verify
```
