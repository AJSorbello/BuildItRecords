# Vercel Deployment Configuration for BuildItRecords

This document explains the configuration setup for deploying the BuildItRecords application on Vercel without PostgreSQL native module dependencies.

## Overview

The application is configured to deploy on Vercel by replacing PostgreSQL-related dependencies with mock implementations to avoid native module compilation issues during the deployment process. The application continues to use Supabase for database operations.

## Key Configuration Files

### 1. `vercel.json`

This file configures how Vercel builds and serves the application:

```json
{
  "version": 2,
  "buildCommand": "node ./scripts/vercel-build-patch.js && pnpm install --no-frozen-lockfile && pnpm run build",
  "installCommand": "echo 'Installation handled by buildCommand'",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./{package.json,pnpm-lock.yaml,server/package.json}",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "zeroConfig": true,
        "skipInstall": true
      }
    },
    {
      "src": "server/server.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["server/package.json"]
      }
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server/server.js"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

### 2. `.npmrc`

This file prevents native module build scripts from running:

```
ignore-scripts=true
node-linker=hoisted
public-hoist-pattern[]=*pg*
public-hoist-pattern[]=*libpq*
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

### 3. `scripts/vercel-build-patch.js`

This script automatically runs during the build process and:

1. Creates a `.npmrc` file for dependency management
2. Cleans up all PostgreSQL-related dependencies from package.json files
3. Adds package overrides to replace PostgreSQL modules with empty implementations
4. Creates mock implementations for PostgreSQL native modules
5. Patches Sequelize to avoid requiring the PostgreSQL native modules

### 4. `webpack.config.js`

Provides additional configuration for client-side bundling:

```js
module.exports = {
  resolve: {
    fallback: {
      pg: false,
      'pg-native': false,
      'pg-hstore': false,
      libpq: false,
    },
    alias: {
      pg: require.resolve('@vercel/noop'),
      'pg-native': require.resolve('@vercel/noop'),
      'pg-hstore': require.resolve('@vercel/noop'),
      libpq: require.resolve('@vercel/noop'),
    },
  },
};
```

## Package Overrides

The package.json files contain overrides to replace PostgreSQL dependencies with `@vercel/noop`:

```json
"overrides": {
  "pg": "npm:@vercel/noop",
  "pg-native": "npm:@vercel/noop",
  "pg-hstore": "npm:@vercel/noop",
  "libpq": "npm:@vercel/noop"
}
```

## Deployment Steps

1. **Prepare Your Code**:
   - Ensure all PostgreSQL direct dependencies are removed
   - Verify all database operations use Supabase
   - Set up proper environment variables

2. **Configure Vercel**:
   - Connect your GitHub repository to Vercel
   - Set the appropriate environment variables in Vercel Dashboard
   - Use the configuration files described above

3. **Deployment Workflow**:
   - Push code to GitHub repository
   - Vercel automatically detects changes and triggers a deployment
   - The `vercel-build-patch.js` script runs to modify dependency configuration
   - pnpm installs dependencies with `--no-frozen-lockfile` to allow updating the lockfile
   - The application builds with mock PostgreSQL dependencies
   - Vercel deploys the built application

## Supabase Integration

For successful deployment with Supabase:

1. Make sure all direct PostgreSQL queries are replaced with equivalent Supabase queries
2. Update any sequelize or PostgreSQL-specific models to use Supabase data access patterns
3. Properly set up Supabase environment variables in Vercel project settings

## Environment Variables

Ensure the following environment variables are set in the Vercel project:

- `SUPABASE_URL`: URL for your Supabase instance
- `SUPABASE_KEY`: API key for your Supabase instance
- `SUPABASE_SERVICE_KEY`: (if needed) Service role key for Supabase
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Production environment setting
- Other application-specific environment variables as needed

## Troubleshooting Common Issues

If encountering deployment issues:

1. **Lockfile Mismatch**: Use `--no-frozen-lockfile` when running pnpm install, especially after updating dependencies
2. **Native Module Build Errors**: Ensure all PostgreSQL-related dependencies are properly overridden
3. **Missing Modules**: Check if any transitive dependencies require PostgreSQL and update the patch script
4. **Sequelize Errors**: The patch script includes a special handler for Sequelize that may need updates 
5. **Build Failures**: Check the Vercel build logs for specific errors
6. **Runtime Errors**: Verify environment variables are correctly set in Vercel Dashboard

## Maintenance

When adding new dependencies:
1. Check if they have PostgreSQL dependencies
2. If they do, update the `vercel-build-patch.js` script to handle them
3. Update the lockfile locally before pushing changes
4. Consider testing the build process locally before pushing to Vercel

## Testing Your Deployment

After successful deployment:

1. Test the core functionalities of your application
2. Verify that database operations are working correctly with Supabase
3. Check media uploads and static asset serving
4. Test API endpoints for proper functionality
5. Verify authentication flows work as expected

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [pnpm Documentation](https://pnpm.io/)
