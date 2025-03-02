# Vercel Deployment Configuration for BuildItRecords

This document explains the configuration setup for deploying the BuildItRecords application on Vercel without PostgreSQL native module dependencies.

## Overview

The application is configured to deploy on Vercel by replacing PostgreSQL-related dependencies with mock implementations to avoid native module compilation issues during the deployment process. The application continues to use Supabase for database operations.

## Key Configuration Files

1. **vercel.json**: Contains deployment configuration that uses a custom build script approach
   - Defines routes for serving static files and API endpoints
   - Sets environment variables for the build process
   - Specifies build output location

2. **build-script.sh**: Custom shell script that handles the build process
   - Bypasses pnpm lockfile issues by using npm instead
   - Creates mock implementations for PostgreSQL modules
   - Handles dependency installation and build steps

## How It Works

1. When Vercel starts the deployment, it reads the `vercel.json` configuration
2. Instead of using the standard build command, it executes our custom `build-script.sh`
3. The script removes any existing lock files and uses npm to avoid pnpm lockfile issues
4. PostgreSQL dependencies are mocked to prevent native compilation errors
5. The application is built and output to the `dist` directory
6. Vercel serves the static files based on the routes configuration

## Deployment Branch

The `vercel-deploy-fix` branch contains the latest deployment configuration. After deploying successfully, these changes can be merged into the `main` branch.

## Troubleshooting

If you encounter deployment issues:

1. **Lock File Errors**: The custom build script should handle this, but verify in logs
2. **PostgreSQL Errors**: Check if mock implementations are being properly created
3. **Environment Variables**: Ensure all required environment variables are set in Vercel
4. **Build Script Execution**: Verify the build script has execute permissions
5. **Build Failures**: Check the Vercel build logs for specific errors
6. **Runtime Errors**: Verify environment variables are correctly set in Vercel Dashboard

## Maintenance

To update the deployment configuration:

1. Modify the `build-script.sh` file to change the build process
2. Update `vercel.json` if you need to modify routes or deployment settings
3. Commit and push changes to the `vercel-deploy-fix` branch
4. Monitor Vercel deployment logs for any issues

## Recent Changes (2025-03-02)

We've completely changed the deployment approach to resolve persistent issues with pnpm lock files:

1. **Switched to Custom Build Script**: Created a dedicated shell script that handles the entire build process
2. **Bypass pnpm Issues**: Using npm instead of pnpm to avoid lockfile problems
3. **Mock PostgreSQL Modules**: Creating direct mock implementations in the build script
4. **Simplified vercel.json**: Updated configuration to use the custom build approach

These changes should resolve the deployment issues that were occurring with the previous approach.
