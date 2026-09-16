module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  // CSS はテスト環境で解釈できないため空モジュールへ差し替える（preset の
  // moduleNameMapper とマージされ、`@/` エイリアス等はそのまま維持される）。
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest/style-mock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/dist/', '/ios/', '/android/'],
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
