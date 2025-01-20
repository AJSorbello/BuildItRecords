const path = require('path');

module.exports = function override(config) {
  // Add source map support
  config.devtool = 'source-map';

  // Configure module resolution
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      '@mui/styled-engine': '@mui/styled-engine-sc',
      '@': path.resolve(__dirname, 'src'),
      'utils': path.resolve(__dirname, 'src/utils'),
      'hooks': path.resolve(__dirname, 'src/hooks'),
      'types': path.resolve(__dirname, 'src/types'),
      'services': path.resolve(__dirname, 'src/services')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    fallback: {
      "util": require.resolve("util/"),
      "path": require.resolve("path-browserify"),
      "fs": false,
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/")
    }
  };

  // Add plugins
  if (!config.plugins) {
    config.plugins = [];
  }

  return config;
};
