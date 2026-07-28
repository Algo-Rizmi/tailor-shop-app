import { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, Text, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ReceiptListScreen from './src/screens/ReceiptListScreen';
import NewReceiptScreen from './src/screens/NewReceiptScreen';
import ReceiptDetailScreen from './src/screens/ReceiptDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import type { RootStackParamList } from './src/types/navigation';
import { isLoggedIn } from './src/storage/settings';
import { setUnauthorizedHandler } from './src/api/client';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    (async () => {
      const loggedIn = await isLoggedIn();
      setInitialRoute(loggedIn ? 'ReceiptList' : 'Login');
    })();

    setUnauthorizedHandler(() => {
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerTintColor: colors.primary }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log In', headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen
          name="ReceiptList"
          component={ReceiptListScreen}
          options={({ navigation }) => ({
            title: 'Receipts',
            headerBackVisible: false,
            headerRight: () => (
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={{ color: colors.primary, fontSize: 15 }}>Settings</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen name="NewReceipt" component={NewReceiptScreen} options={{ title: 'New Receipt' }} />
        <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} options={{ title: 'Receipt' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
