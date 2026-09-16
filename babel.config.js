// babel-preset-expo は react-native-worklets を検出すると Reanimated 用の
// worklets プラグインを自動で追加するため、ここで明示的に足す必要はない。
// inline-import プラグインは Drizzle のマイグレーション（.sql）を
// JS バンドルへ取り込むために必要。
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
