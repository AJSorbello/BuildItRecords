#!/bin/bash
# Script to fix MUI styled-engine errors in the build process

# Create a simple mock implementation of the styled-engine
cat > styled-engine-mock-module.js <<'EOF'
/**
 * This file provides a mock implementation of @mui/styled-engine
 * to fix errors related to missing functions during the migration to ShadCN UI
 */
export function internal_serializeStyles() {
  return {
    name: 'mockStyles',
    styles: '',
    next: null
  };
}

export function styled(tag) {
  return function(styles) {
    return function StyledComponent(props) {
      const { children, className = '', ...otherProps } = props;
      return React.createElement(
        tag,
        {
          ...otherProps,
          className: `${className} mui-styled`,
        },
        children
      );
    };
  };
}

export default {
  internal_serializeStyles,
  styled
};
EOF

echo "Created mock styled-engine module"

# Create a temporary directory for the MUI module
mkdir -p temp_modules/@mui/styled-engine

# Copy the mock implementation to the temporary directory
cp styled-engine-mock-module.js temp_modules/@mui/styled-engine/index.js

echo "Mock styled-engine module is ready"
echo ""
echo "To use this module, run your build with:"
echo "NODE_PATH=./temp_modules bun run build"
echo ""
echo "This is a temporary solution until the migration to ShadCN UI is complete."
