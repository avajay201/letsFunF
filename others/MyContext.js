import React, { createContext, useEffect, useRef, useState } from 'react';
import { G_SOCKET_URL } from '../actions/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastAndroid } from 'react-native';


export const MainContext = createContext(null);

export const MainProvider = ({ children }) => {
  const gChatWS = useRef(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [wsData, setWSData] = useState(null);
  const [isLogged, setIsLogged] = useState(false);

  const fetchAuth = async()=>{
    try {
        const auth_user = await AsyncStorage.getItem("auth_user");
        const auth_token = await AsyncStorage.getItem("auth_token");
        if (!auth_user || !auth_token) {
          return;
        }
        setUser(auth_user);
        setToken(auth_token);
      } catch (error) {
        console.error('Error fetching auth data:', error);
      }
  };

  useEffect(()=>{
    if (isLogged && isLogged != 'logout'){
      fetchAuth();
    }
  }, [isLogged]);

  // Global socket start
  useEffect(()=>{
    console.log('Token:', token, 'User:', user, 'Loging:', isLogged);
    if (isLogged === 'logout' || !isLogged || !user || !token || gChatWS.current){
      return
    }
    console.log('Global WS connecting...');

    gChatWS.current = new WebSocket(`${G_SOCKET_URL}/${token}/`);

    gChatWS.current.onopen = () => {
        ToastAndroid.show('connected', ToastAndroid.SHORT);
    };

    gChatWS.current.onmessage = (event) => {
        const messageData = JSON.parse(event.data);
        setWSData(messageData);
        console.log("Msg received from global server(context):", messageData);
    };

    gChatWS.current.onclose = () => {
        ToastAndroid.show('dis-connected', ToastAndroid.SHORT);
    };

    return () => {
        gChatWS.current.close();
    };
  }, [user, token, isLogged]);
  // Global socket end

  return (
    <MainContext.Provider value={{wsData, isLogged, setIsLogged}}>
      {children}
    </MainContext.Provider>
  );
};
