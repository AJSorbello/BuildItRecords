import React from 'react';
import { Box } from '@mui/material';
import { useCustomTheme } from '../contexts/ThemeContext';

interface TabBarContainerProps {
  children: React.ReactNode;
}

export function TabBarContainer({ children }: TabBarContainerProps) {
  const { colors } = useCustomTheme();

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
