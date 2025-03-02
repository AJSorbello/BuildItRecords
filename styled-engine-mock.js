/**
 * This file will be used by the module aliasing system to replace @mui/styled-engine
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

export default {
  internal_serializeStyles,
  styled
};
