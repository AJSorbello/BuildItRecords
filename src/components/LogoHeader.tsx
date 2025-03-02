import React from 'react';
import { Box } from '@mui/material';
import BuildItRecordsLogo from '../assets/png/records/BuildItRecords.png';
import BuildItTechLogo from '../assets/png/tech/BuildIt_Tech.png';
import BuildItDeepLogo from '../assets/png/deep/BuildIt_Deep.png';

interface LogoHeaderProps {
  label: string;
  sx?: any;
}

const getLogo = (label: string) => {
  switch (label.toUpperCase()) {
    case 'TECH':
      return BuildItTechLogo;
    case 'DEEP':
      return BuildItDeepLogo;
    default:
      return BuildItRecordsLogo;
  }
};

const LogoHeader: React.FC<LogoHeaderProps> = ({ label, sx = {} }) => {
  const logo = getLogo(label);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '116px',
        backgroundColor: 'transparent',
        position: 'fixed',
        top: '64px',
        width: '240px',
        zIndex: 1200,
        ...sx
      }}
    >
      <Box
        component="img"
        src={logo}
        alt={`${label} Logo`}
        sx={{
          width: '200px',
          height: 'auto',
          maxHeight: '80px',
          objectFit: 'contain',
          filter: 'brightness(0) invert(1)'
        }}
      />
    </Box>
  );
};

export default LogoHeader;
