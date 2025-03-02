# Common Issues and Troubleshooting

## React Component Errors

### 1. "Cannot convert object to primitive value"

**Symptoms:**
- Blank screen with this error in the console
- Often occurs with MUI components

**Fixes:**
- Our `mui-polyfill.ts` should catch these errors
- If you still encounter them, look for objects being used where primitives are expected
- Check for improper usage of React props, especially in placeholder components

### 2. "process is not defined"

**Symptoms:**
- Error in console about process not being defined
- Often occurs when importing modules that expect Node.js environment

**Fixes:**
- Ensure `process-polyfill.ts` is imported at the very top of your entry file
- If you create new modules that reference `process.env`, make sure they're imported after the polyfill

### 3. React DevTools Warning

**Symptoms:**
- Console message: "Download the React DevTools for a better development experience"

**Fixes:**
- This is just a warning, not an error
- It's being suppressed by our `window-polyfill.ts`
- You can install React DevTools for your browser if you want better debugging tools

### 4. Blank Screen (No Errors)

**Symptoms:**
- Application loads but shows a blank white screen
- No visible errors in the console

**Fixes:**
1. Check for error boundary catches:
   - Errors might be caught by error boundaries
   - Look in your browser's network tab for failed API requests
2. Check React rendering:
   - Add console.log statements in the App component to see if it's rendering
3. Check CSS issues:
   - Content might be rendering but hidden due to CSS

## TypeScript Errors

### 1. Missing Exports from MUI Placeholder

**Symptoms:**
- Build error: "No matching export in mui-placeholder.tsx"

**Fixes:**
- Add the missing component to `mui-placeholder.tsx`
- Make sure to add it to both the individual export and the named exports object at the bottom

### 2. Type Errors in Components

**Symptoms:**
- TypeScript errors about incompatible types

**Fixes:**
- Use `any` type in placeholders temporarily
- When migrating to ShadCN, implement proper TypeScript interfaces

## API and Backend Issues

### 1. Failed API Requests

**Symptoms:**
- Network errors in the console
- Data not loading in the application

**Fixes:**
- Make sure the backend server is running on port 3001
- Check that API endpoints are correctly defined
- Verify that CORS is properly configured

### 2. Backend Server Not Starting

**Symptoms:**
- Error when running `bun run backend`

**Fixes:**
- Check that all dependencies are installed
- Verify that port 3001 is not already in use

## Build Issues

### 1. Build Fails with Module Errors

**Symptoms:**
- Bun build fails with module resolution errors

**Fixes:**
- Run with `NODE_PATH=./temp_modules` as we've set up
- Check that package.json has the correct dependencies

### 2. Missing Files After Build

**Symptoms:**
- Build succeeds but application doesn't work
- 404 errors for resource files

**Fixes:**
- Check that the build process includes copying of necessary static files
- Verify that the `public` directory contents are copied to `dist`

## Migration-Specific Issues

### 1. ShadCN Components Not Working with MUI Placeholders

**Symptoms:**
- Layout issues or strange behavior when mixing ShadCN and MUI placeholders

**Fixes:**
- Migrate components in logical groups
- Ensure styling approaches don't conflict

### 2. Icon Import Errors

**Symptoms:**
- Errors about missing icons

**Fixes:**
- Add the icon to the mapping in `icons/index.tsx`
- Make sure it's exported in both named and default export formats
