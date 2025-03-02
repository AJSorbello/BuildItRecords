# MUI to ShadCN Migration Guide

## Current Status

We're in the process of migrating from Material UI (MUI) to ShadCN UI. This guide documents the current status, common issues, and solutions we've implemented.

## Key Components

1. **Polyfills**
   - `process-polyfill.ts`: Fixes "process is not defined" errors by providing Node.js environment variables.
   - `window-polyfill.ts`: Fixes React 18 compatibility issues and suppresses unnecessary warnings.
   - `mui-polyfill.ts`: Handles MUI-specific errors like "Cannot convert object to primitive value".

2. **Placeholder Components**
   - `mui-placeholder.tsx`: Temporary implementations of MUI components using Tailwind CSS.
   - These are meant to be gradually replaced with ShadCN UI components.

3. **Icon Mappings**
   - `icons/index.tsx`: Maps MUI icons to Lucide icons for compatibility.

## Common Errors and Solutions

### "process is not defined"
This error occurs when code expects Node.js's `process` object to be available in the browser.
- **Solution**: Import `process-polyfill.ts` before any other code.

### "Cannot convert object to primitive value"
This error occurs in certain MUI components during their initialization.
- **Solution**: Import `mui-polyfill.ts` which patches `Array.prototype.reduce`.

### Blank Screen
If you're seeing a blank screen in the application, check the following:
1. Look for console errors in the browser dev tools.
2. Ensure all necessary component placeholders are implemented in `mui-placeholder.tsx`.
3. Check for missing icon exports in `icons/index.tsx`.

### React DevTools Warning
This warning is harmless and is suppressed by our `window-polyfill.ts`.

## Migration Process

1. **Step 1: Create Placeholders** ✅
   - Replace MUI imports with local imports pointing to placeholder components.

2. **Step 2: Fix Critical Build Errors** ✅
   - Add missing components and exports to fix build failures.

3. **Step 3: Fix Runtime Errors** ✅ 
   - Add polyfills to address browser environment issues.

4. **Step 4: Incremental Replacement** (In Progress)
   - Gradually replace placeholder components with ShadCN equivalents.
   - Start with simpler components like buttons, then move to more complex ones.

5. **Step 5: Remove Placeholders** (Planned)
   - Once a component is fully migrated, remove its placeholder.
   - Update all imports to point directly to the ShadCN component.

## Testing Strategy

1. After each component migration, test the following scenarios:
   - Basic rendering and appearance
   - Component interactions (click, hover, etc.)
   - Responsiveness across different screen sizes
   - Integration with other components

2. Regression testing:
   - Ensure that migrated components don't break existing functionality.
   - Check that routing still works correctly.
   - Verify that data fetching and display work as expected.

## Next Steps

1. **Implement ShadCN Button**: Replace MUI Button with ShadCN Button.
2. **Migrate Typography**: Implement ShadCN typography styles.
3. **Migrate Layout Components**: Box, Container, Grid, etc.
4. **Migrate Form Controls**: Input, Checkbox, Radio, etc.
5. **Migrate Navigation**: AppBar, Drawer, etc.
6. **Migrate Dialogs and Modals**: Dialog, Modal, etc.

## Resources

- [ShadCN UI Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MUI Documentation](https://mui.com/material-ui/getting-started/) (for reference)
