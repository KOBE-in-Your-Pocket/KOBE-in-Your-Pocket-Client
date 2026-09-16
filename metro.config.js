const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// pnpm 環境で同一ネイティブモジュールが複数パスから解決されると
// RNSScreenStackScreen / RNSSafeAreaView などの二重登録エラーになる。
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

const singletonPackages = [
  'react',
  'react-native',
  'expo',
  'expo-router',
  'react-native-screens',
  'react-native-safe-area-context',
  'react-native-gesture-handler',
  'react-native-reanimated',
];

config.resolver.extraNodeModules = singletonPackages.reduce((acc, name) => {
  acc[name] = path.resolve(projectRoot, 'node_modules', name);
  return acc;
}, {});

// Drizzle のマイグレーションファイル（.sql）を Metro が解決できるようにする。
config.resolver.sourceExts.push('sql');

module.exports = config;
