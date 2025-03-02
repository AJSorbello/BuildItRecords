/**
 * This file provides a mapping layer for MUI component imports
 * to ShadCN UI components to ease the migration process.
 */

// Re-export ShadCN UI components
export * from './button';
export * from './sheet';

// MUI placeholder components for gradual migration
export {
  Typography,
  Box,
  Container,
  ThemeProvider,
  styled
} from './mui-placeholder';

// Icons mapping can be set up here as needed
// export { Menu as MenuIcon } from 'lucide-react';
