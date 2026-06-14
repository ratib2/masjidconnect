// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import MosquesScreen from '../screens/MosquesScreen';
import NearbyScreen from '../screens/NearbyScreen';
import MosqueDetailScreen from '../screens/MosqueDetailScreen';
import QiblaScreen from '../screens/QiblaScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import AdminAnnouncementsScreen from '../screens/AdminAnnouncementsScreen';
import AdminApprovalsScreen from '../screens/AdminApprovalsScreen';
import AddMosqueScreen from '../screens/AddMosqueScreen';
import CalendarScreen from '../screens/CalendarScreen';
import DhikrScreen from '../screens/DhikrScreen';
import ToolsHubScreen from '../screens/ToolsHubScreen';
import DuaScreen from '../screens/DuaScreen';
import QuranScreen from '../screens/QuranScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AsmaulHusnaScreen from '../screens/AsmaulHusnaScreen';
import RamadanScreen from '../screens/RamadanScreen';
import { useTheme, COLORS } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MosquesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MosqueSearch" component={MosquesScreen} />
      <Stack.Screen name="MosqueDetail" component={MosqueDetailScreen} />
      <Stack.Screen name="AddMosque" component={AddMosqueScreen} />
    </Stack.Navigator>
  );
}

function NearbyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NearbyMain" component={NearbyScreen} />
      <Stack.Screen name="MosqueDetail" component={MosqueDetailScreen} />
      <Stack.Screen name="AddMosque" component={AddMosqueScreen} />
    </Stack.Navigator>
  );
}

function ToolsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ToolsHub" component={ToolsHubScreen} />
      <Stack.Screen name="CalendarMain" component={CalendarScreen} />
      <Stack.Screen name="Dhikr" component={DhikrScreen} />
      <Stack.Screen name="Qibla" component={QiblaScreen} />
      <Stack.Screen name="Dua" component={DuaScreen} />
      <Stack.Screen name="AsmaulHusna" component={AsmaulHusnaScreen} />
      <Stack.Screen name="Ramadan" component={RamadanScreen} />
      <Stack.Screen name="Quran" component={QuranScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="AdminLogin" component={AdminScreen} />
      <Stack.Screen name="AdminAnnouncements" component={AdminAnnouncementsScreen} />
      <Stack.Screen name="AdminApprovals" component={AdminApprovalsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 10 },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Mosques: focused ? 'search' : 'search-outline',
            Nearby: focused ? 'location' : 'location-outline',
            Tools: focused ? 'apps' : 'apps-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Mosques" component={MosquesStack} options={{ tabBarLabel: 'Cerca' }} />
      <Tab.Screen name="Nearby" component={NearbyStack} options={{ tabBarLabel: 'Vicino' }} />
      <Tab.Screen name="Tools" component={ToolsStack} options={{ tabBarLabel: 'Strumenti' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: 'Profilo' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: COLORS.primary,
          background: colors.bg,
          card: colors.bg,
          text: colors.text,
          border: colors.border,
          notification: COLORS.primary,
        },
      }}
    >
      <TabNavigator />
    </NavigationContainer>
  );
}
