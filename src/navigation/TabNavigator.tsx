import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen as BuildItRecordsHome } from '../screens/BuildItRecords/HomeScreen';
import { HomeScreen as BuildItTechHome } from '../screens/BuildItTech/HomeScreen';
import { HomeScreen as BuildItDeepHome } from '../screens/BuildItDeep/HomeScreen';
import SearchLabels from '../screens/Debug/SearchLabels';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createMaterialTopTabNavigator();

export default function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          textTransform: 'none',
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
        tabBarShowIcon: true,
      }}
    >
      <Tab.Screen
        name="Records"
        component={BuildItRecordsHome}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/png/records/BuildIt_Records_Square.png')}
              style={[
                styles.tabIcon,
                {
                  opacity: focused ? 1 : 0.7,
                  tintColor: focused ? colors.primary : colors.textSecondary,
                },
              ]}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Tech"
        component={BuildItTechHome}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/png/tech/BuildIt_Tech_Square.png')}
              style={[
                styles.tabIcon,
                {
                  opacity: focused ? 1 : 0.7,
                  tintColor: focused ? colors.primary : colors.textSecondary,
                },
              ]}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Deep"
        component={BuildItDeepHome}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/png/deep/BuildIt_Deep_Square.png')}
              style={[
                styles.tabIcon,
                {
                  opacity: focused ? 1 : 0.7,
                  tintColor: focused ? colors.primary : colors.textSecondary,
                },
              ]}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchLabels}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
