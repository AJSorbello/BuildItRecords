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
