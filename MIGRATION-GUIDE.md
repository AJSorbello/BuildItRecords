# Material UI to ShadCN UI Migration Guide

## Overview

This document outlines the strategy for migrating the BuildIt Records application from Material UI (MUI) to ShadCN UI. The migration is being done gradually to ensure the application remains functional throughout the process.

## Current Status

- Material UI imports have been replaced with placeholder components from `mui-placeholder.tsx`
- Three ShadCN components have been implemented and integrated:
  - Button
  - Card
  - Input
- TypeScript errors have been addressed in critical files:
  - Fixed errors in the icons mapping file
  - Improved type safety in `trackUtils.ts`
- The application builds successfully with placeholder components

## Migration Strategy

### Phase 1: Placeholder Setup (Completed)
- Created placeholder components in `mui-placeholder.tsx`
- Replaced direct MUI imports with placeholder imports
- Created scripts for automation and progress tracking
- Updated critical components (App, HomePage, Layout, Navigation, etc.)

### Phase 2: Component Migration (In Progress)
- Implement ShadCN UI components one by one
- Update the placeholder to use the new ShadCN components
- Components to prioritize:
  1. ✅ Button (implemented)
  2. ✅ Card (implemented)
  3. ✅ Input (implemented)
  4. ✅ Select (implemented)
  5. Layout components (Container, Box, Grid)
  6. Typography
  7. Form components (Checkbox)
  8. Navigation components (Tabs, Drawer)
  9. Feedback components (Alert, Dialog, Snackbar)
  10. Data display components (Table, List)

### Phase 3: Theme Migration
- Replace MUI theming with ShadCN/Tailwind theme configuration
- Update dark/light mode functionality
- Ensure consistent styling across components

### Phase 4: Testing & Cleanup
- Test all components and interactions
- Remove unnecessary code and dependencies
- Fix any TypeScript errors identified during migration
- Update documentation

## Placeholder to ShadCN Component Mapping

| MUI Component | ShadCN Component | Status |
|---------------|------------------|--------|
| Button | button.tsx | ✅ Completed |
| Card | card.tsx | ✅ Completed |
| TextField | input.tsx | ✅ Completed |
| Select | select.tsx | ✅ Completed |
| Box | N/A (Use div with Tailwind classes) | 🔄 Pending |
| Typography | N/A (Use semantic HTML with Tailwind) | 🔄 Pending |
| Container | N/A (Use div with container class) | 🔄 Pending |
| Checkbox | checkbox.tsx | 🔄 Pending |
| Table | table.tsx | 🔄 Pending |
| Drawer | sheet.tsx | 🔄 Pending |
| Dialog | dialog.tsx | 🔄 Pending |
| Alert | alert.tsx | 🔄 Pending |
| Tabs | tabs.tsx | 🔄 Pending |
| List | N/A (Use ul/li with Tailwind) | 🔄 Pending |
| IconButton | button.tsx (with icon variant) | 🔄 Pending |
| Menu | dropdown-menu.tsx | 🔄 Pending |
| Paper | N/A (Use div with appropriate classes) | 🔄 Pending |

## TypeScript Error Handling

TypeScript errors are being addressed in parallel with the migration. The strategy follows the prioritization defined in the MEMORIES:

1. **Critical Errors (Fix Immediately)**
   - Build-breaking errors
   - Runtime crashes
   - Core functionality issues

2. **Blocking Type Errors (Fix Early)**
   - Incorrect data types that could cause UI bugs
   - API response type mismatches

3. **Basic Functionality (Temporarily Defer)**
   - Missing type annotations
   - Unused variables
   - Implicit any types in non-critical areas

## Progress on TypeScript Errors

- Initial count: 351 TypeScript errors
- Current count: 349 TypeScript errors
- Fixed issues:
  - Improved icon exports and imports in the UI icons file
  - Enhanced type safety in trackUtils.ts with proper type annotations and JSDoc comments
  - Fixed any types and added null checks

## Scripts and Tools

Two helper scripts have been created to assist with the migration:

1. **replace-mui-imports.sh**
   - Automatically replaces MUI imports with placeholder imports
   - Creates backups of modified files

2. **typescript-error-report.sh**
   - Generates a report of TypeScript errors in the codebase
   - Helps prioritize which errors to fix first

## Next Steps

1. Continue implementing remaining ShadCN components:
   - Sheet (for Drawer replacement)
   - Checkbox 
   - Table
   - Dialog

2. Address remaining TypeScript errors in critical areas:
   - Focus on database services
   - Fix validation schema type conflicts
   - Ensure proper typing for Spotify API integration

3. Test the application in various scenarios:
   - Different screen sizes
   - Various user interactions
   - Edge cases in data loading/error states

## Resources

- [ShadCN UI Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
