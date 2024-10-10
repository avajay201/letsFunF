import React, { useEffect, useState, useCallback, useRef } from 'react';
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


const configuration = {
  iceServers: [
    { urls: 'stun:stun1.l.google.com:19302' }, // Alternative Google STUN server
  ],
};

const AudioCall = ({ navigation }) => {
  const route = useRoute();
  const { userName } = route.params;
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('Idle');
  const [roomName, setRoomName] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [micPermission, setMicPermission] = useState(false);
  const callWS = useRef();
  const peerRef = useRef();

  // Helper function to fetch user and token from AsyncStorage
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
      const callName = `${auth_user}__${userName}`;
      setRoomName(callName);
    } else {
      ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAuth();
    }, [])
  );

  const sendSignal = (action, message) => {
    const jsonStr = JSON.stringify({
      peer: user,
      action: action,
      message: message,
    });
    callWS.current?.send(jsonStr);
  };

  // WebSocket message handler
  const wsMessageHandler = (event) => {
    const parsedData = JSON.parse(event.data);
    const peerUser = parsedData.message.peer;
    const action = parsedData.message.action;

    if (user === peerUser) return;
    console.log('parsedData>>>', parsedData);
    let receiveChannelName = parsedData.message.receive_channel_name;
    if (action === 'new-peer') {
      createOffer(receiveChannelName);
    } else if (action === 'new-offer') {
      receiveChannelName = parsedData.message.message.receive_channel_name;
      const offer = parsedData.message.message.sdp;
      createAnswer(offer, receiveChannelName);
    } else if (action === 'new-answer') {
      const answer = parsedData.message.message.sdp;
      peerRef.current.setRemoteDescription(answer);
    }
  };

  useEffect(() => {
    if (!micPermission) {
      requestMicrophonePermission();
    }

    if (!roomName || !token || !user || !micPermission || callWS.current) {
      return;
    }

    const ws = new WebSocket(`${AC_SOCKET_URL}/${roomName}/${token}/`);
    ws.onopen = () => {
      callWS.current = ws;
      console.log('WebSocket connected');
    };

    ws.addEventListener('message', wsMessageHandler);

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      callWS.current = null;
    };

    return () => {
      ws.close();
    };
  }, [user, token, roomName, micPermission]);

  const requestMicrophonePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setMicPermission(true);
        console.log('Microphone permission granted');
      } else {
        ToastAndroid.show('Microphone permission denied!', ToastAndroid.SHORT);
        navigation.navigate('Home');
      }
    } catch (err) {
      ToastAndroid.show('Microphone permission issue!', ToastAndroid.SHORT);
      navigation.navigate('Home');
    }
  };

  const startCall = async () => {
    // Get local media stream
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    setLocalStream(stream);
    setCallStatus('Calling...');
    sendSignal('new-peer', {});
  };

  const addLocalTracks = (peer) => {
    localStream?.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });
  };

  const setOnTrack = (peer) => {
    peer.ontrack = (event) => {
      stream.addTrack(event.track);
      setRemoteStream(stream);
    };
  };

  const createOffer = async (receiveChannelName) => {
    const peer = new RTCPeerConnection(configuration);
    peer.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', peer.iceGatheringState);
    };

    peer.onconnectionstatechange = () => {
      console.log('Connection state:', peer.connectionState);
    };

    peer.addEventListener('icecandidateerror', (event) => {
      console.error('ICE Candidate Error:', event);
    });

    addLocalTracks(peer);
    setOnTrack(peer);
  
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate);
      } else {
        console.log('All ICE candidates have been gathered.');
        // Send the offer after all ICE candidates are gathered
        sendSignal('new-offer', {
          sdp: peer.localDescription,
          receive_channel_name: receiveChannelName,
        });
      }
    };
  
    try {
      const offer = await peer.createOffer(
        {
          offerToReceiveAudio: true,
          offerToReceiveVideo: false, // Modify according to your needs
        }
      );
      await peer.setLocalDescription(offer);
      peer.restartIce();
      console.log('Offer created and set:', peer.localDescription);
    } catch (error) {
      console.error('Error creating or setting offer:', error);
    }
  
    peerRef.current = peer;
  };

  const createAnswer = async (offer, receiveChannelName) => {
    const peer = new RTCPeerConnection(configuration);
    addLocalTracks(peer);
    setOnTrack(peer);

    peer.onicecandidate = (event) => {
      if (!event.candidate) {
        sendSignal('new-answer', {
          sdp: peer.localDescription,
          receive_channel_name: receiveChannelName,
        });
      }
    };

    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    peerRef.current = peer;
  };

  const endCall = () => {
    setCallStatus('Idle');
    localStream?.getTracks().forEach((track) => track.stop());
    peerRef.current?.close();
    setLocalStream(null);
    setRemoteStream(null);
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
