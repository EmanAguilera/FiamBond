const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Windows-friendly NativeWind v4 resolution
let withNativeWind;
try {
  withNativeWind = require("nativewind/metro-config").withNativeWind;
} catch (e) {
  // Fallback to direct path if Windows export map fails
  const directPath = path.resolve(__dirname, "node_modules/nativewind/dist/metro/index.js");
  withNativeWind = require(directPath).withNativeWind;
}

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });