module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // 1. Mandatory for Expo + NativeWind v4
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // 2. NativeWind v4 Preset
      "nativewind/babel",
    ],
    plugins: [
      // 1. Module Resolver (Para sa code logic)
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "react-native-worklets": "react-native-worklets-core",
          },
        },
      ],
      // 2. Worklets Plugin - Gamitin ang aliased name
      "react-native-worklets/plugin",
      // 3. Reanimated Plugin (Laging huli)
      "react-native-reanimated/plugin",
    ],
  };
};