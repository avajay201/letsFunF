// import * as Notifications from 'expo-notifications';
// import Constants from 'expo-constants';

// export const registerForPushNotificationsAsync = async () => {
//   let token;

//   // Check if the app is running on a physical device
//   if (Constants.deviceName) {
//     // Request for notification permissions
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     // Ask for permission if not granted
//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     // Check final status and get token
//     if (finalStatus !== 'granted') {
//       alert('Failed to get push token for push notification!');
//       return;
//     }

//     // Get the push token
//     token = (await Notifications.getExpoPushTokenAsync()).data;
//   } else {
//     alert('Must use physical device for Push Notifications');
//   }

//   return token;
// };
