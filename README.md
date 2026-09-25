# Monowave

A beautiful, open-source music player built with React Native and Expo. Monowave offers a premium, ad-free listening experience focused on a dark aesthetic, seamless navigation, and smart local recommendations.

## ✨ Features

- **Premium UI/UX:** A carefully crafted dark mode interface with glassmorphism elements, custom Phosphor icons, and smooth micro-animations.
- **Smart Recommendations:** Built-in recommendation engine that learns from your listening history, likes, and playlists to curate a personalized Discover Mix.
- **Robust Playback:** Uses `expo-audio` and NewPipe Extractor to resolve and stream high-quality audio seamlessly.
- **Local Library:** All your likes, playlists, history, and queue are stored locally on your device for absolute privacy.
- **YouTube Music Import:** Easily import public playlists directly from YouTube Music into your local library.
- **Seamless Navigation:** Custom tab-based history navigation stack with native Android hardware back-button support for a flawless UX.

## 🛠 Tech Stack

- **Framework:** React Native + Expo (SDK 57)
- **Language:** TypeScript
- **Styling:** Vanilla React Native StyleSheet (Zero dependencies, pure performance)
- **Icons:** Phosphor Icons (`phosphor-react-native`, `react-native-svg`)
- **Storage:** AsyncStorage
- **Audio/Media:** `expo-audio`, NewPipe Extractor (via Native Modules)

## 🚀 How It Was Made

Monowave was built with a strict focus on "Music First" architecture:
1. **The Core Engine:** We leveraged Expo's powerful audio API alongside custom stream extraction to parse playable streams from standard video URLs without heavy backend dependencies.
2. **The UX Overhaul:** We moved away from generic UI frameworks and text-based icons. Instead, we implemented a custom design system entirely in standard React Native `StyleSheet`, achieving complete control over gradients, spacing, and typography.
3. **Optimizing Interactions:** To solve the common React Native "rapid tap" audio overlap bugs, we implemented immediate playback suspension hooks. To handle navigation smoothly, we bypassed heavy routing libraries in favor of a custom, lightweight array-based history stack that flawlessly syncs with Android's hardware back behavior.

## 📦 Building from Source

To build Monowave locally, ensure you have Node.js and the Android SDK installed.

1. Clone the repository:
   ```bash
   git clone https://github.com/rajasgames/Monowave.git
   cd Monowave
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Prebuild native Android folders:
   ```bash
   npm run prebuild:android
   ```
4. Build the APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
The output APK will be available in `android/app/build/outputs/apk/release/app-release.apk`.

## 📜 License
This project is licensed under the GPL-3.0-or-later License.
