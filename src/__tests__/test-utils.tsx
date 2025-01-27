import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';

const testTheme = createTheme();

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={testTheme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

describe('custom render', () => {
  it('renders with all providers', () => {
    const TestComponent = () => <div>Test</div>;
    const { container } = customRender(<TestComponent />);
    expect(container).toBeDefined();
    expect(container.firstChild).toBeDefined();
  });
});

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
