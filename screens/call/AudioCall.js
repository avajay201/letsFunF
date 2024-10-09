import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Button,
  Text,
  StyleSheet,
  PermissionsAndroid,
  ToastAndroid,
} from 'react-native';
import { mediaDevices, RTCPeerConnection } from 'react-native-webrtc';
import { AC_SOCKET_URL } from './../../actions/API';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";

const ws = new WebSocket(`${AC_SOCKET_URL}/`);

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

const AudioCall = ({ navigation }) => {
  const route = useRoute();
  const { userName } = route.params;
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [callStatus, setCallStatus] = useState('Idle');
  const [roomName, setRoomName] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  let callName;


  const fetchAuth = async () => {
    const auth_user = await AsyncStorage.getItem("auth_user");
    const auth_token = await AsyncStorage.getItem("auth_token");
    if (!auth_user || !auth_token) {
      ToastAndroid.show("Session expired, please login.", ToastAndroid.SHORT);
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      navigation.navigate("Login");
      return;
    }

    setUser(auth_user);
    setToken(auth_token);
    if (auth_user && userName) {
      callName = `${auth_user}__${userName}`;
      setRoomName(callName);
      fetchMessages();
      return;
    }
    ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAuth();
    }, [])
  );

  useEffect(() => {
    if (!roomName || !token || !user){
      return;
    }

    const setupWebSocket = () => {
      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        if (data.type === 'offer') {
          await handleOffer(data);
        } else if (data.type === 'answer') {
          await handleAnswer(data);
        } else if (data.type === 'ice-candidate') {
          await handleIceCandidate(data);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
    };

    setupWebSocket();
    requestMicrophonePermission();
    return () => {
      ws.close();
    };
  }, [user, token, roomName]);

  const requestMicrophonePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Microphone permission granted');
      } else {
        console.log('Microphone permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const startCall = async () => {
    setCallStatus('Calling...');
    const newPeerConnection = new RTCPeerConnection(configuration);
    setPeerConnection(newPeerConnection);
    
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: false, // For audio call only
    });
    setLocalStream(stream);
    
    stream.getTracks().forEach(track => newPeerConnection.addTrack(track, stream));

    newPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
      }
    };

    const offer = await newPeerConnection.createOffer();
    await newPeerConnection.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', sdp: offer }));
  };

  const handleOffer = async (data) => {
    const newPeerConnection = new RTCPeerConnection(configuration);
    setPeerConnection(newPeerConnection);

    const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
    setLocalStream(stream);
    
    stream.getTracks().forEach(track => newPeerConnection.addTrack(track, stream));

    newPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
      }
    };

    await newPeerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    const answer = await newPeerConnection.createAnswer();
    await newPeerConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
  };

  const handleAnswer = async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    setCallStatus('In Call');
  };

  const handleIceCandidate = async (data) => {
    const candidate = new RTCIceCandidate(data.candidate);
    await peerConnection.addIceCandidate(candidate);
  };

  const endCall = () => {
    setCallStatus('Idle');
    localStream && localStream.getTracks().forEach(track => track.stop());
    peerConnection && peerConnection.close();
    setLocalStream(null);
    setPeerConnection(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{callStatus}</Text>
      {callStatus === 'Idle' ? (
        <Button title="Start Call" onPress={startCall} />
      ) : (
        <Button title="End Call" onPress={endCall} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default AudioCall;
