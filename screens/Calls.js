import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, ToastAndroid } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Avatar } from './comps/chats/Avatar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MyLayout from './MyLayout';


export default function Calls({navigation}) {
  const calls = [
    { 
      id: '1', 
      name: 'Alice Johnson', 
      callTime: '10:30 AM', 
      avatar: '', 
      callType: 'voice',
      callDirection: 'outgoing',
    },
    { 
      id: '2', 
      name: 'Bob Smith', 
      callTime: 'Yesterday', 
      avatar: '', 
      callType: 'video', 
      callDirection: 'incoming',
    },
    { 
      id: '3', 
      name: 'Charlie Brown', 
      callTime: 'Monday', 
      avatar: '', 
      callType: 'voice', 
      callDirection: 'outgoing',
    },
    { 
      id: '4', 
      name: 'Diana Prince', 
      callTime: 'Tuesday', 
      avatar: '', 
      callType: 'video', 
      callDirection: 'incoming',
    },
  ];

  const handleChat = (name) => {
    // navigation.navigate('Chat', { userName: name });
    ToastAndroid.show(`Start chat with ${name}`, ToastAndroid.SHORT);
  };
  
  const handleCall = (name, callType) => {
    const callAction = callType === 'video' ? 'video call' : 'voice call';
    ToastAndroid.show(`Start ${callAction} with ${name}`, ToastAndroid.SHORT);
  };

  const renderItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      delay={index * 100}
    >
      <TouchableOpacity style={styles.callItem}>
        <Avatar src={item.avatar} name={item.name} is_url={false} />
        <View style={styles.callDetails}>
          <Text style={styles.callName}>{item.name}</Text>
          
          <Text style={styles.callTime}>
            {item.callDirection === 'outgoing' ? 'You called' : 'Incoming call'} at {item.callTime}
          </Text>
        </View>

        <View style={styles.callActions}>
          <TouchableOpacity onPress={() => handleChat(item.name)}>
            <MaterialIcons name="chat" size={24} color="#009387" style={styles.actionIcon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleCall(item.name, item.callType)}>
            {item.callType === 'video' ? (
              <Ionicons name="videocam" size={24} color="#009387" style={styles.actionIcon} />
            ) : (
              <Ionicons name="call" size={24} color="#009387" style={styles.actionIcon} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <MyLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Calls</Text>
        </View>
        <FlatList
          data={calls}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </MyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  callItem: {
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
  callDetails: {
    flex: 1,
    marginLeft: 10,
  },
  callName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  callTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  callActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginHorizontal: 10,
  },
});
