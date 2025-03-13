// Type definitions for @testing-library/jest-dom
// Project: https://github.com/testing-library/jest-dom
// Typings by BuildItRecords

declare module '@testing-library/jest-dom' {
  // Module exports nothing, it extends Jest's matchers
}

declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveAttribute(attr: string, value?: string): R;
    toHaveClass(className: string): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeEmpty(): R;
    toBeInvalid(): R;
    toBeRequired(): R;
    toBeValid(): R;
    toContainElement(element: HTMLElement | null): R;
    toContainHTML(html: string): R;
    toHaveFocus(): R;
    toHaveFormValues(values: { [name: string]: any }): R;
    toHaveStyle(css: string | object): R;
    toHaveValue(value?: string | string[] | number): R;
  }
}
