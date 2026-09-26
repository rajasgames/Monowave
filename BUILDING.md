# Building Monowave

This app requires a custom Expo Dev Client because it includes native Android code (the `StreamExtractorModule`).

## Prerequisites

- Node.js (see `.nvmrc` for version)
- Java 17+
- Android Studio / Android SDK

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the Android module and Dev Client:
   ```bash
   npm run prebuild:android
   npm run android
   ```

## Development

Once the dev client is installed on your emulator/device, you can start the bundler:
```bash
npm start
```
