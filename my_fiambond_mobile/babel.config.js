// babel.config.js

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
      // 1. Module Resolver (KEEP THIS IF YOU NEED OTHER ALIASES, otherwise remove the whole block)
      [
        "module-resolver",
        {
          root: ["./"],
          // REMOVED: alias: { "react-native-worklets": "react-native-worklets-core" },
        },
      ],
      // 2. Worklets Plugin - This MUST match the core package name
      "react-native-worklets-core/plugin",
      // 3. Reanimated Plugin (Always keep this last)
      "react-native-reanimated/plugin",
    ],
  };
};