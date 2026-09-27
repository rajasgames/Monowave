# Contributing to Monowave

Thank you for your interest in contributing to Monowave! This guide outlines our architecture conventions, development workflow, and pull request requirements.

---

## 1. Core Principles

Monowave is built with strict architectural commitments:

- **Local-first**: Never introduce a mandatory account or remote Monowave server.
- **Privacy-respecting**: Never add analytics, tracking SDKs, or background telemetry.
- **GPL-3.0-or-later**: All contributions are licensed under GPL-3.0-or-later.
- **Strict Typing**: No `any`, `@ts-ignore`, or unchecked type assertions without technical justification.
- **Separation of Concerns**: Presentation screens must not access storage or native extractors directly.

---

## 2. Prerequisites & Setup

### Requirements

- **Node.js**: `22.x` (LTS)
- **Java Development Kit (JDK)**: JDK 17 (Zulu or Temurin)
- **Android SDK**: API level 34+ build tools, Android 7.0+ (API 24) minimum target

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/rajasgames/Monowave.git
cd Monowave

# Install exact dependencies
npm ci

# Verify development environment
npm run doctor
```

---

## 3. Development Workflow

### Running Locally with Android Dev Client

```bash
# Generate clean Android project files
npm run prebuild:android

# Compile and launch the app on an Android device or emulator
npm run android

# Start the Expo development server
npm start
```

### Running Tests and Linters

```bash
# Run TypeScript compilation checks
npm run typecheck

# Run ESLint validation
npm run lint

# Check Prettier code formatting
npm run format:check

# Run Jest unit test suite
npm test

# Run tests with code coverage report
npx jest --coverage
```

---

## 4. Where Does Code Belong?

| Directory        | Responsibility                                       | Guidelines                                                                  |
| ---------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/core/`      | Domain types, error taxonomy, result wrappers        | Pure TypeScript, zero React or native dependencies                          |
| `src/storage/`   | Repositories, migration logic, schemas               | All persistence logic lives here. No raw `AsyncStorage` outside this folder |
| `src/playback/`  | Audio state machine, queue algorithms, player engine | Manages playback lifecycles, retries, and locks                             |
| `src/providers/` | Stream resolution, music catalogs, NewPipe bridge    | Encapsulates network parsing and stream extraction                          |
| `src/services/`  | On-device recommendation engine, scoring models      | Deterministic math, bounded computations                                    |
| `src/state/`     | React controllers, granular contexts                 | Splits UI state by lifecycle to avoid re-render amplification               |
| `src/screens/`   | Top-level screen views                               | Presentation only. Consumes controllers via hooks                           |
| `src/ui/`        | Theme tokens, reusable visual components             | Accessibility labels, minimum 48dp touch targets, responsive safe areas     |

---

## 5. Pull Request Checklist

Before submitting a pull request, ensure all quality gates pass:

- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run lint` passes with zero warnings.
- [ ] `npm run format:check` reports all files match Prettier style.
- [ ] `npm test` passes all test suites.
- [ ] New features or bug fixes include unit test coverage.
- [ ] Screens and interactive elements include accessibility labels and roles.
- [ ] No hardcoded colors or magic numbers; use `C` from `src/ui/theme.ts`.
- [ ] No direct `AsyncStorage` calls added to UI components.
- [ ] No secrets, keys, or sensitive logs committed.
