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
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Add any custom middleware here
      middlewares.unshift((req, res, next) => {
        // Pre-middleware logic (formerly onBeforeSetupMiddleware)
        next();
      });

      middlewares.push((req, res, next) => {
        // Post-middleware logic (formerly onAfterSetupMiddleware)
        next();
      });

      return middlewares;
    },
    // Modern webpack-dev-server options
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
    compress: true,
    hot: true,
    historyApiFallback: true,
  }
};
