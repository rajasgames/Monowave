/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.(spec|test).[jt]s?(x)"],
  modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/.expo/"],
  moduleNameMapper: {
    "^expo-modules-core$": "<rootDir>/tests/mocks/expo-modules-core.ts",
    "^expo-audio$": "<rootDir>/tests/mocks/expo-audio.ts",
    "^@react-native-async-storage/async-storage$":
      "<rootDir>/tests/mocks/async-storage.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
};
