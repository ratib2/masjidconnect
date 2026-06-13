import 'react-native-gesture-handler';
import './src/utils/i18n';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AppProvider } from './src/context/AppContext';
import { FeaturesProvider } from './src/context/FeaturesContext';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Notifiche in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function App() {
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then((val) => {
      setOnboardingDone(val === '1');
    });
  }, []);

  // Ancora in caricamento
  if (onboardingDone === null) return null;

  // Mostra onboarding al primo avvio
  if (!onboardingDone) {
    return (
      <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
    );
  }

  return (
    <AppProvider>
      <FeaturesProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </FeaturesProvider>
    </AppProvider>
  );
}

registerRootComponent(App);
