/**
 * Type declarations for Material UI modules
 * This file helps TypeScript recognize Material UI imports without errors
 */

declare module '@mui/material' {
  export * from '@mui/material/index';
}

declare module '@mui/material/styles' {
  export * from '@mui/material/styles/index';
}

declare module '@mui/icons-material/Close' {
  import { SvgIconProps } from '@mui/material/SvgIcon';
  import * as React from 'react';

  const CloseIcon: React.ComponentType<SvgIconProps>;
  export default CloseIcon;
}

declare module '@mui/icons-material/PlayArrow' {
  import { SvgIconProps } from '@mui/material/SvgIcon';
  import * as React from 'react';

  const PlayArrowIcon: React.ComponentType<SvgIconProps>;
  export default PlayArrowIcon;
}

declare module 'react-router-dom' {
  export * from 'react-router-dom/dist/index';
}
