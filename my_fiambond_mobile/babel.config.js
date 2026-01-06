// my_fiambond_mobile/babel.config.js

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // FIX: Removed the incorrect 'twrnc/babel' plugin
    // twrnc works fine with the default 'babel-preset-expo'
    plugins: [], // or just remove the plugins property if it's empty
  };
};