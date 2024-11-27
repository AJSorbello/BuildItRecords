import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';

interface TabBarContainerProps {
  children: React.ReactNode;
}

export function TabBarContainer({ children }: TabBarContainerProps) {
  const { colors } = useTheme();

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: colors.background,
        boxShadow: `0px 2px 3.84px ${colors.shadow}25`,
      }}
    >
      {children}
    </Box>
  );
}
