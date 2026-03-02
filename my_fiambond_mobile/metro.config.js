const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/dist/metro");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Enable symlinks for monorepo support
config.resolver.unstable_enableSymlinks = true;

module.exports = withNativeWind(config, { 
  input: "./src/app/globals.css" 
});
