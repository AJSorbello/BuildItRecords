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
  
  // Add declaration for testing-library jest-dom
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value?: string | string[] | number): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
    }
  }
}

// Declare the testing-library/jest-dom module
declare module '@testing-library/jest-dom';

// Need this to make the file a module
export {};
