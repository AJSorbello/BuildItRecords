// TypeScript declarations for missing modules
declare module 'react' {
  // This is a backup declaration in case @types/react isn't properly loaded
}

declare module 'react/jsx-runtime' {
  // This is a backup declaration in case @types/react isn't properly loaded
}

// CSS modules declaration
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Image files declaration
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
