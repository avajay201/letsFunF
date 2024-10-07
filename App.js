import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Platform } from 'react-native';
import Login from './screens/auth/Login';
import Register from './screens/auth/Register';
import Home from './screens/Home';
import Profile from './screens/Profile';
import Calls from './screens/Calls';
import Chat from './screens/chats/Chat';
import { MainProvider } from './others/MyContext';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';


const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // notication start
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState([]);
  const [notification, setNotification] = useState(undefined);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync().then(value => setChannels(value ?? []));
    }
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;
  
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
      // EAS projectId is used here.
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log(token);
      } catch (e) {
        token = `${e}`;
      }
    } else {
      alert('Must use physical device for Push Notifications');
    }
  
    return token;
  }
  
  // notication end

  // Check user logged in or not start
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const authToken = await AsyncStorage.getItem('auth_token');
        setIsLoggedIn(!!authToken);
      } catch (e) {
        console.error('Failed to check login status', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);
  // Check user logged in or not end

  // Loading start
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' color='#009387' />
      </View>
    );
  };
  // Loading end

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'Home' : 'Login'}
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}>
          <Stack.Screen
            name='Home'
            component={Home}
            options={{
              headerTitle: '',
              header: (props) => null,
          }} />
          <Stack.Screen
            name='Login'
            component={Login}
            options={{
              headerTitle: '',
              header: (props) => null,
          }} />
          <Stack.Screen
            name='Register'
            component={Register}
            options={{
              headerTitle: '',
              header: (props) => null,
          }} />
          <Stack.Screen
            name='Profile'
            component={Profile}
            options={{
              headerTitle: '',
              header: (props) => null,
          }} />
          <Stack.Screen
            name='Calls'
            component={Calls}
            options={{
              headerTitle: '',
              header: (props) => null,
          }} />
          <Stack.Screen
            name='Chat'
            component={Chat}
            options={{
              headerTitle: '',
              header: (props) => null,
          }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function AppWrapper() {
  return (
    <MainProvider>
      <App />
    </MainProvider>
  );
}