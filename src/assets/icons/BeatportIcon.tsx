import * as React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const BeatportIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.75c-5.385 0-9.75-4.365-9.75-9.75S6.615 2.25 12 2.25s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75zm0-17.5c-4.273 0-7.75 3.477-7.75 7.75s3.477 7.75 7.75 7.75 7.75-3.477 7.75-7.75-3.477-7.75-7.75-7.75zm0 13.5c-3.17 0-5.75-2.58-5.75-5.75S8.83 6.25 12 6.25s5.75 2.58 5.75 5.75-2.58 5.75-5.75 5.75z"/>
  </SvgIcon>
);

export default BeatportIcon;
