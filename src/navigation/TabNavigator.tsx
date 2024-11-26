import React from 'react';
import { Image, StyleSheet, Platform } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen as BuildItRecordsHome } from '../screens/BuildItRecords/HomeScreen';
import { HomeScreen as BuildItTechHome } from '../screens/BuildItTech/HomeScreen';
import { HomeScreen as BuildItDeepHome } from '../screens/BuildItDeep/HomeScreen';
import SearchLabels from '../screens/Debug/SearchLabels';
import { ReleaseManagerScreen } from '../screens/Admin/ReleaseManagerScreen';
import { useTheme } from '../contexts/ThemeContext';
import { TabBarContainer } from '../components/TabBarContainer';

const Tab = createMaterialTopTabNavigator();

export default function TabNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <TabBarContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
            ...Platform.select({
              web: {
                boxShadow: isDark 
                  ? '0 1px 3px rgba(0, 0, 0, 0.3)'
                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
              },
            }),
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
            width: 32,
            height: 32,
          },
          tabBarShowIcon: true,
          animationEnabled: Platform.OS !== 'web',
          swipeEnabled: Platform.OS !== 'web',
        }}
      >
        <Tab.Screen
          name="Records"
          component={BuildItRecordsHome}
          options={{
            tabBarIcon: ({ focused }) => (
              <Image
                source={require('../assets/png/records/BuildIt_Records.png')}
                style={[
                  styles.tabIcon,
                  {
                    opacity: focused ? 1 : 0.7,
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
                source={require('../assets/png/tech/BuildIt_Tech.png')}
                style={[
                  styles.tabIcon,
                  {
                    opacity: focused ? 1 : 0.7,
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
                source={require('../assets/png/deep/BuildIt_Deep.png')}
                style={[
                  styles.tabIcon,
                  {
                    opacity: focused ? 1 : 0.7,
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
        <Tab.Screen
          name="ReleaseManager"
          component={ReleaseManagerScreen}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-outline" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </TabBarContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 32,
    height: 32,
  },
});
