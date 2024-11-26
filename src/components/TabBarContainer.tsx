import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface TabBarContainerProps {
  children: React.ReactNode;
}

export function TabBarContainer({ children }: TabBarContainerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          ...Platform.select({
            ios: {
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            },
            android: {
              elevation: 5,
            },
            web: {
              boxShadow: `0px 2px 3.84px ${colors.shadow}25`,
            },
          }),
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
