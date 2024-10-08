import React, { useEffect, useState, useCallback, useContext } from 'react';
import MyLayout from './MyLayout';
import {View, Text, FlatList, StyleSheet, TouchableOpacity, ToastAndroid, ActivityIndicator } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar } from './comps/chats/Avatar';
import { userChats } from '../actions/APIActions';
import { BASE_URL } from '../actions/API';
import { MainContext } from '../others/MyContext';


export default function Home({ navigation }) {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const { wsData, setIsLogged } = useContext(MainContext);

  // Get chats start
  const fetchChats = async () => {
    setIsLoading(true);
    const response = await userChats();
    if (response[0] === 200) {
      setChats(response[1]);
    } else if (response[0] === 401) {
      ToastAndroid.show('Session expired, please login.', ToastAndroid.SHORT);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      navigation.navigate('Login');
      return;
    } else {
      ToastAndroid.show('Something went wrong!', ToastAndroid.SHORT);
    }
    setIsLoading(false);
  };
  // Get chats end

  // Get auth data start
  const fetchAuth = async () => {
    const auth_user = await AsyncStorage.getItem("auth_user");
    // const auth_token = await AsyncStorage.getItem("auth_token");
    if (!auth_user) {
      ToastAndroid.show('Session expired, please login.', ToastAndroid.SHORT);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      navigation.navigate('Login');
      return;
    }
    setUser(auth_user);
  };
  // Get auth data end

  useFocusEffect(
    useCallback(() => {
      setIsLogged(true);
      fetchChats();
      fetchAuth();
    }, [])
  );

  useEffect(()=>{
    if (!wsData){
      return;
    }
    const status = wsData['status'];
    if (status === 'msg') {
      setChats(wsData['chats']);
    }
    else if (status === 'status'){
      const members = wsData['members'].filter(member => member != user);
      setActiveUsers(members);
    }
    else if (status === 'typing'){
      let updatedChats;
      if (wsData['isTyping']){
        updatedChats = chats.map(chat => {
          if (chat.username === wsData['sender']) {
            return { ...chat, is_typing: true };
          }
          return chat;
        });
      }
      else{
        updatedChats = chats.map(chat => {
          if (chat.username === wsData['sender']) {
            return { ...chat, is_typing: false };
          }
          return chat;
        });
      }
      if (updatedChats){
        setChats(updatedChats);
      }
    }
  }, [wsData]);

  useEffect(()=>{
    const membersData = chats.filter(chat => activeUsers.includes(chat.username));
    setActiveMembers(membersData);
  }, [activeUsers]);

  // Render chats start
  const renderItem = ({ item, index }) => (
    <Animatable.View animation="fadeInUp" duration={500} delay={index * 100}>
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { userName: item.username })}
      >
        <Avatar src={item.is_blocked ? require('../assets/profile.png') : (item.profile_picture ? BASE_URL + item.profile_picture : null)} name={item.username} is_url={item.is_blocked ? false : true} />
        <View style={styles.chatDetails}>
          <Text style={styles.chatName}>{item.username}</Text>
          <Text style={[
            styles.chatMessage, 
            { color: item.unseen_msgs > 0 || item.is_typing ? 'green' : '#999', fontWeight: item.unseen_msgs > 0 ? 'bold' : 'normal' }
          ]}>{item.is_typing ? 'typing...' : (item.msg_type === 'Text' ? (item?.last_message?.length > 30 ? item?.last_message.slice(0, 30) + '...' : item.last_message) : item.msg_type)}</Text>
        </View>
        {item.unseen_msgs > 0 && <Text style={styles.unseenMsgs}>{item.unseen_msgs}</Text>}
        <Text style={styles.chatTime}>{item.last_message_time}</Text>
      </TouchableOpacity>
    </Animatable.View>
  );
  // Render chats end

  // Render active users start
  const renderActiveUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.activeUserItem}
      onPress={() => navigation.navigate('Chat', { userName: item.username })}
    >
      <View style={styles.activeUserContainer}>
        <Avatar
          src={item.is_blocked ? '' : (item.profile_picture ? BASE_URL + item.profile_picture : null)}
          name={item.username}
          is_url={item.is_blocked ? false : true}
          style={styles.activeUserAvatar}
        />
        <View style={styles.onlineDot} />
      </View>
      <Text style={styles.activeUserName}>{item.username}</Text>
    </TouchableOpacity>
  );
  // Render active users end

  return (
    <MyLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Chats</Text>
        </View>

        {isLoading ? (
          // Show loader while chats are loading
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <>
            {/* Active Users Section */}
            {activeMembers.length > 0 && (
              <FlatList
                data={activeMembers}
                renderItem={renderActiveUserItem}
                keyExtractor={(item, index) => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activeUsersList}
              />
            )}

            {/* Chats Section */}
            {chats.length === 0 ? (
              <View style={styles.noChatsContainer}>
                <Text style={styles.noChatsText}>No chats available</Text>
              </View>
            ) : (
              <FlatList
                data={chats}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}

      </View>
    </MyLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    marginTop: 35,
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  activeUsersList: {
    paddingHorizontal: 10,
    paddingBottom: 5,
    height: 80,
    backgroundColor: '#fff',
    minWidth: '100%',
  },
  activeUserItem: {
    alignItems: 'center',
    marginRight: 10,
  },
  activeUserContainer: {
    position: 'relative',
  },
  activeUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'green',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#fff',
  },
  activeUserName: {
    marginTop: 5,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 1,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chatDetails: {
    flex: 1,
    marginLeft: 10,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chatMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  unseenMsgs: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: 'green',
    padding: 3,
    borderRadius: 50,
    width: 20,
    height: 20,
    textAlign: 'center',
    marginRight: 15,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  noChatsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noChatsText: {
    fontSize: 18,
    color: '#999',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
