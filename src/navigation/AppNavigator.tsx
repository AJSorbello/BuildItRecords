import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Platform, Image, View, StyleSheet } from 'react-native';

// Import screens
import { HomeScreen as RecordsHomeScreen } from '../screens/BuildItRecords/HomeScreen';
import { HomeScreen as TechHomeScreen } from '../screens/BuildItTech/HomeScreen';
import { HomeScreen as DeepHomeScreen } from '../screens/BuildItDeep/HomeScreen';

const Tab = createMaterialTopTabNavigator();

const TabLogo = ({ source }: { source: any }) => (
  <View style={styles.tabLogoContainer}>
    <Image source={source} style={styles.tabLogo} />
  </View>
);

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#121212',
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            borderBottomWidth: 1,
            height: 60,
          },
          tabBarActiveTintColor: '#02FF95',
          tabBarInactiveTintColor: '#FFFFFF',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'bold',
            textTransform: 'none',
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#02FF95',
          },
        }}
      >
        <Tab.Screen
          name="BuildItRecords"
          component={RecordsHomeScreen}
          options={{
            title: 'Build It Records',
            tabBarIcon: ({ focused }) => (
              <TabLogo source={require('../assets/png/records/BuildIt_Records_Square.png')} />
            ),
          }}
        />
        <Tab.Screen
          name="BuildItTech"
          component={TechHomeScreen}
          options={{
            title: 'Build It Tech',
            tabBarIcon: ({ focused }) => (
              <TabLogo source={require('../assets/png/tech/BuildIt_Tech_Square.png')} />
            ),
          }}
        />
        <Tab.Screen
          name="BuildItDeep"
          component={DeepHomeScreen}
          options={{
            title: 'Build It Deep',
            tabBarIcon: ({ focused }) => (
              <TabLogo source={require('../assets/png/deep/BuildIt_Deep_Square.png')} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLogo: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
});
