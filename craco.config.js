const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "path": require.resolve("path-browserify"),
          // Empty implementations for Node.js modules
          "fs": false,
          "net": false,
          "tls": false,
          "dns": false,
          "dgram": false,
        }
      },
      plugins: [
        // Add Node.js polyfills
        new webpack.ProvidePlugin({
          process: 'process/browser',
        }),
      ]
    }
  }
};
