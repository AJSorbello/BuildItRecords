/**
 * Global TypeScript declarations for the BuildItRecords app
 */

import * as React from 'react';

declare global {
  // Declare the JSX namespace for components
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  
  // Ensure React is available globally
  const React: typeof import('react');
}

// Need this to make the file a module
export {};
