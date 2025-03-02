/**
 * This file provides a fix for MUI v6 styled-engine compatibility issues
 * Adapted from: https://github.com/mui/material-ui/issues/38753
 */

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import React from 'react';

// The styled engine from @emotion/styled
import styled from '@emotion/styled';

// Export everything from emotion
export * from '@emotion/styled';
export * from '@emotion/react';

// Create app-wide emotion cache
export const cache = createCache({
  key: 'mui-style',
  prepend: true,
});

// Export styled as the default export
export default styled;

// Add the internal_serializeStyles mock that MUI is trying to import
export const internal_serializeStyles = () => ({
  name: 'mui-fix',
  styles: '',
  map: undefined,
  next: undefined,
});

// Wrap your app with this provider
export const StyleEngineProvider = ({ children }) => {
  return <CacheProvider value={cache}>{children}</CacheProvider>;
};
