declare module '@testing-library/jest-dom' {
  // Import from @testing-library/jest-dom
  export * from '@testing-library/jest-dom';
}

// This is to support the implicit type library reference
declare namespace jest {
  interface Matchers<R> {
    // Add Jest DOM matchers (simplified version)
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveAttribute(attr: string, value?: string | RegExp): R;
    // Add more matchers as needed
  }
}
