/**
 * This file directly patches the @mui/styled-engine to fix the
 * "No matching export in @mui/styled-engine for import internal_serializeStyles" error
 */

// Create a mock of the internal_serializeStyles function
export function internal_serializeStyles() {
  return {
    name: 'mockStyles',
    styles: '',
    next: null
  };
}

// Provide a basic implementation of the styled function
export function styled(tag) {
  return function(styles) {
    return function StyledComponent(props) {
      const { children, className = '', ...otherProps } = props;
      return {
        tag,
        props: {
          ...otherProps,
          className: `${className} mui-styled`,
          children
        }
      };
    };
  };
}

// Export a default object to satisfy imports
export default {
  internal_serializeStyles,
  styled
};
