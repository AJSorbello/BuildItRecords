/**
 * This is a special webpack configuration for Vercel deployments
 * It handles PostgreSQL-related module resolution issues
 */

module.exports = {
  // Tell webpack to ignore pg-related modules
  resolve: {
    fallback: {
      pg: false,
      'pg-native': false,
      'pg-hstore': false,
      libpq: false,
    },
    alias: {
      // Replace PostgreSQL modules with empty implementations
      pg: require.resolve('@vercel/noop'),
      'pg-native': require.resolve('@vercel/noop'),
      'pg-hstore': require.resolve('@vercel/noop'),
      libpq: require.resolve('@vercel/noop'),
    },
  },
};
