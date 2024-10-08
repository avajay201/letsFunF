import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  ToastAndroid,
  ActivityIndicator,
  Animated,
  SectionList,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  userMessages,
  messageDelete,
  clearChat,
  blockUser,
  sendMediaMessage,
} from "../../actions/APIActions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SOCKET_URL } from "../../actions/API";
import { MessageDeleteModal } from "../comps/chats/MessageDeleteModal";
import { BASE_URL } from "../../actions/API";
import { Avatar } from "../comps/chats/Avatar";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Video } from "expo-av";

const MESSAGE_HEIGHT = 100; // message height
const Chat = ({ navigation }) => {
  const route = useRoute();
  const { userName } = route.params;
  const [messages, setMessages] = useState([]);
  const [sections, setSections] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const chatWS = useRef(null);
  const flatListRefs = useRef({});
  const [roomName, setRoomName] = useState(null);
  const [userStatus, setUserStatus] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [userProfile, setUserProfile] = useState({});
  const [chatOn, setChatOn] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [messageImagePreview, setMessageImagePreview] = useState(null);
  const [messageSendingLoader, setMessageSendingLoader] = useState(false);
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB in bytes
  let chatName;

  // scroll messages start
  useEffect(() => {
    if (flatListRefs.current && sections.length > 0) {
      flatListRefs.current.scrollToLocation({
        sectionIndex: sections.length - 1,
        itemIndex: sections[sections.length - 1].data.length - 1,
        animated: true,
      });
    }
  }, [sections]);
  // scroll messages end

  // Get message layout start
  const getMessageLayout = (data, index) => {
    const length = MESSAGE_HEIGHT;
    return {
      length,
      offset: length * index,
      index,
    };
  };
  // Get message layout end

  // typing indicator start
  const dot1Opacity = useRef(new Animated.Value(0)).current;
  const dot2Opacity = useRef(new Animated.Value(0)).current;
  const dot3Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTyping]);
  // typing indicator end

  // Get auth data start
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
      chatName = `${auth_user}__${userName}`;
      setRoomName(chatName);
      fetchMessages();
      return;
    }
    ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT);
  };
  // Get auth data end

  // Get messages start
  const fetchMessages = async () => {
    if (!chatName) {
      ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT);
      return;
    }
    setIsLoading(true);
    const response = await userMessages({ chat: chatName });
    if (response[0] === 200) {
      setMessages(response[1].messages);
      setUserProfile(response[1].profile);
      if (!response[1].profile.blocked) {
        setChatOn(true);
      }
    } else if (response[0] === 401) {
      ToastAndroid.show("Session expired, please login.", ToastAndroid.SHORT);
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      navigation.navigate("Login");
    } else {
      ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT);
    }
    setIsLoading(false);
  };
  // Get messages end

  useFocusEffect(
    useCallback(() => {
      fetchAuth();
    }, [])
  );

  // Chat socket start
  useEffect(() => {
    if (!roomName || !token || userProfile.blocked || !chatOn) {
      return;
    }

    if (userProfile.blocked && chatWS.current) {
      chatWS.current.close();
    }

    if (!chatOn && chatWS.current) {
      chatWS.current.close();
    }

    if (
      (!userProfile.blocked && chatWS.current) ||
      (chatOn && chatWS.current)
    ) {
      return;
    }

    chatWS.current = new WebSocket(`${SOCKET_URL}/${roomName}/${token}/`);

    chatWS.current.onopen = () => {
      console.log("WebSocket connected");
    };

    chatWS.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Message received from server:", data);
      const messageData = data["message"];
      const status = messageData["status"];
      if (status === "msg") {
        // if (
        //   (messageData["message"]["image"] ||
        //     messageData["message"]["video"]) &&
        //   messageData["message"]["sender"] === user
        // ) {
        //   setMessages((prev) => {
        //     if (prev.hasOwnProperty("Today")) {
        //       const messageExists = prev.Today.find(
        //         (msg) => msg.id === message.id
        //       );
        //       if (messageExists) {
        //         return {
        //           ...prev,
        //           Today: prev.Today.map((msg) =>
        //             msg.id === message.id ? message : msg
        //           ),
        //         };
        //       } else {
        //         return {
        //           ...prev,
        //           Today: [...prev.Today, message],
        //         };
        //       }
        //     } else {
        //       return {
        //         ...prev,
        //         Today: [message],
        //       };
        //     }
        //   });
        // }
        const message = messageData["message"];
        setMessages((prev) => {
          if (prev.hasOwnProperty("Today")) {
            const messageExists = prev.Today.find(
              (msg) => msg.id === message.id
            );
            if (messageExists) {
              return {
                ...prev,
                Today: prev.Today.map((msg) =>
                  msg.id === message.id ? message : msg
                ),
              };
            } else {
              return {
                ...prev,
                Today: [...prev.Today, message],
              };
            }
          } else {
            return {
              ...prev,
              Today: [message],
            };
          }
        });
        // setMessages((prev) => {
        //   if (prev.hasOwnProperty("Today")) {
        //     return {
        //       ...prev,
        //       Today: [...prev.Today, message],
        //     };
        //   } else {
        //     return {
        //       ...prev,
        //       Today: [message],
        //     };
        //   }
        // });
      } else if (status === "status") {
        setUserStatus(messageData["result"] === "online" ? true : false);
        const updatedMessages = messageData["messages"];
        if (updatedMessages) {
          setMessages(updatedMessages);
        }
      } else if (status === "typing") {
        if (messageData["sender"] === userName) {
          if (messageData["isTyping"]) {
            setIsTyping(true);
          } else {
            setIsTyping(false);
          }
        }
      } else if (status === "block") {
        if (messageData["isBlocked"] && messageData["sender"] != user) {
          setChatOn(false);
        }
      }
    };

    chatWS.current.onclose = () => {
      console.log("WebSocket disconnected");
      if (newMessage || selectedMedia.length > 0) {
        ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT);
        navigation.navigate("Home");
      }
    };

    return () => {
      chatWS.current.close();
    };
  }, [roomName, token, userProfile.blocked, chatOn]);
  // Chat socket end

  // Toggle model start
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };
  // Chat socket end

  // Handle menu option start
  const handleMenuOption = (option) => {
    toggleModal();
    if (option === "profile") {
      setProfileModalVisible(true);
    } else if (option === "clear") {
      setConfirmModalVisible("clear");
    } else if (option === "block") {
      setConfirmModalVisible("block");
    } else {
      setReportModalVisible(true);
    }
  };
  // Handle menu option end

  // Message section start
  useEffect(() => {
    const msgSections = Object.entries(messages).map(
      ([date, messageArray]) => ({
        title: date,
        data: messageArray,
      })
    );
    setSections(msgSections);
  }, [messages]);
  // Message section end

  // Render message start
  const renderMessage = ({ item }) => {
    const isSeen = item.is_seen;
    const msgType = item.msg_type;
    const [isMessageModalVisible, setMessageModalVisible] = useState(false);

    // Handle message delete modal start
    const handleMessageDeleteModal = () => {
      setMessageModalVisible(true);
    };
    // Handle message delete modal end

    return (
      <>
        {/* Message */}
        <TouchableOpacity
          onLongPress={messageSendingLoader ? null : handleMessageDeleteModal}
        >
          <Animatable.View
            animation="flipInX"
            duration={300}
            style={[
              styles.messageContainer,
              item.sender === user ? styles.myMessage : styles.otherMessage,
            ]}
          >
            <View>
              {msgType === "Text" ? (
                <Text style={styles.messageText}>{item.content}</Text>
              ) : msgType === "Image" ? (
                <TouchableOpacity
                  onLongPress={
                    messageSendingLoader ? null : handleMessageDeleteModal
                  }
                  onPress={() =>
                    handleMessageImagePreview(BASE_URL + item.image)
                  }
                >
                  <Image
                    source={{ uri: BASE_URL + item.image }}
                    style={styles.messageImage}
                  />
                </TouchableOpacity>
              ) : msgType === "Video" ? (
                <TouchableOpacity
                  onLongPress={
                    messageSendingLoader ? null : handleMessageDeleteModal
                  }
                >
                  <Video
                    source={{ uri: BASE_URL + item.video }}
                    style={styles.messageVideo}
                    useNativeControls={true}
                    resizeMode="contain"
                    isMuted={false}
                    isLooping={false}
                  />
                </TouchableOpacity>
              ) : null}
              <View style={styles.messageFooter}>
                <Text style={styles.messageTime}>{item.timestamp}</Text>
                {item.sender === user && (
                  <MaterialIcons
                    name={isSeen ? "done-all" : "done"}
                    size={16}
                    color={isSeen ? "#34B7F1" : "#999"}
                    style={styles.messageStatusIcon}
                  />
                )}
              </View>
            </View>
          </Animatable.View>
        </TouchableOpacity>

        {/* Message Delete Modal */}
        <MessageDeleteModal
          visible={isMessageModalVisible}
          onClose={() => setMessageModalVisible(false)}
          onDelete={() => handleMessageDelete(item.id)}
        />
      </>
    );
  };
  // Render message end

  // Render message section start
  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
  // Render message section end

  // Send message start
  const sendMessage = async () => {
    if (selectedMedia.length === 0 && !newMessage.trim()) {
      return;
    }
    try {
      setMessageSendingLoader(true);
      if (selectedMedia.length > 0) {
        for (media of selectedMedia) {
          // File validation start
          let msgType;
          if (media.type === "image") {
            msgType = "image";
          } else if (media.type === "video") {
            msgType = "video";
          } else {
            ToastAndroid.show("Failed to send file!", ToastAndroid.SHORT);
            setMessageSendingLoader(false);
            setSelectedMedia([]);
            return;
          }
          // File validation end

          const formData = new FormData();
          formData.append("type", msgType);
          formData.append("name", roomName);
          formData.append("file", {
            uri: media.uri,
            type: media.type === "image" ? "image/jpeg" : "video/mp4",
            name: media.fileName,
          });
          const response = await sendMediaMessage(formData);
          if (response[0] === 201) {
            setMessages((prev) => {
              if (prev.hasOwnProperty("Today")) {
                return {
                  ...prev,
                  Today: [...prev.Today, response[1]],
                };
              } else {
                return {
                  ...prev,
                  Today: [response[1]],
                };
              }
            });

            // Update to receiver start
            const message = {
              message: response[1],
              status: "media_update",
            };
            chatWS.current.send(JSON.stringify({ message }));
            // Update to receiver end
          } else {
            ToastAndroid.show("Failed to send file!", ToastAndroid.SHORT);
          }
        }
        setMessageSendingLoader(false);
        setSelectedMedia([]);
      } else if (newMessage.trim() && chatWS.current) {
        const message = {
          content: newMessage,
          sender: user,
          receiver: userName,
          status: "msg",
          type: "text",
        };
        chatWS.current.send(JSON.stringify({ message }));
        setNewMessage("");
        setMessageSendingLoader(false);
      } else {
        ToastAndroid.show("Failed to send this message!", ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      ToastAndroid.show("Failed to send this message!", ToastAndroid.SHORT);
      setNewMessage("");
      setMessageSendingLoader(false);
      setSelectedMedia([]);
    }
  };
  // Send message end

  // Send typing event start
  const sendTypingEvent = () => {
    if (chatWS.current) {
      const message = {
        status: "typing",
        sender: user,
        receiver: userName,
        isTyping: true,
      };
      chatWS.current.send(JSON.stringify({ message }));
    }
  };
  // Send typing event end

  // Handle input message change start
  const handleTextInputChange = (text) => {
    setNewMessage(text);
    if (text.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      sendTypingEvent();

      typingTimeoutRef.current = setTimeout(() => {
        if (chatWS.current) {
          const message = {
            status: "typing",
            sender: user,
            receiver: userName,
            isTyping: false,
          };
          chatWS.current.send(JSON.stringify({ message }));
        }
      }, 2000);
    }
  };
  // Handle input message change end

  // Handle loading start
  useEffect(() => {
    setIsLoading(false);
  }, [messages]);
  // Handle loading start

  // Clear chat start
  const clearChatMessages = async () => {
    if (!Object.keys(messages).length) {
      setConfirmModalVisible(false);
      ToastAndroid.show("No messages for clear!", ToastAndroid.SHORT);
      return;
    }
    setConfirmModalVisible(false);
    setIsLoading(true);
    const response = await clearChat({ name: roomName });
    if (response[0] === 200) {
      setMessages({});
      ToastAndroid.show("Chat cleared", ToastAndroid.SHORT);
    } else if (response[0] === 401) {
      ToastAndroid.show("Session expired, please login.", ToastAndroid.SHORT);
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      navigation.navigate("Login");
    } else {
      ToastAndroid.show("Failed to clear chat!", ToastAndroid.SHORT);
    }
    setIsLoading(false);
  };
  // Clear chat end

  // Block user start
  const userBlock = async () => {
    setConfirmModalVisible(false);
    setIsLoading(true);
    const response = await blockUser({
      user: userName,
      status: userProfile.other_blocked ? "unblock" : "block",
    });
    if (response[0] === 200) {
      if (chatWS.current) {
        const message = {
          status: "block",
          sender: user,
          receiver: userName,
          isBlocked: userProfile.other_blocked ? false : true,
        };
        chatWS.current.send(JSON.stringify({ message }));
      }
      setTimeout(() => {
        setUserProfile((prevProfile) => ({
          ...prevProfile,
          other_blocked: !userProfile.other_blocked,
        }));
        ToastAndroid.show(
          `User ${userProfile.other_blocked ? "unblocked" : "blocked"}!`,
          ToastAndroid.SHORT
        );
        setIsLoading(false);
      }, 1000);
    } else if (response[0] === 401) {
      ToastAndroid.show("Session expired, please login.", ToastAndroid.SHORT);
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      navigation.navigate("Login");
    } else {
      ToastAndroid.show(
        `Failed to ${userProfile.other_blocked ? "unblock" : "block"} user!`,
        ToastAndroid.SHORT
      );
    }
    setIsLoading(false);
  };
  // Block user end

  // Report user start
  const reportUser = () => {
    setReportModalVisible(false);
    ToastAndroid.show(`${userName} has been reported!`, ToastAndroid.SHORT);
  };
  // Report user end

  // Audio call start
  const handleAudioCall = () => {
    ToastAndroid.show("Audio calling...", ToastAndroid.SHORT);
  };
  // Audio call end

  // Video call start
  const handleVideoCall = () => {
    ToastAndroid.show("Video calling...", ToastAndroid.SHORT);
  };
  // Video call end

  // Message delete start
  const handleMessageDelete = async (msgIid) => {
    const response = await messageDelete({ id: msgIid, name: roomName });
    if (response[0] === 200) {
      setMessages(response[1]);
      ToastAndroid.show("Message deleted", ToastAndroid.SHORT);
    } else if (response[0] === 401) {
      ToastAndroid.show("Session expired, please login.", ToastAndroid.SHORT);
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      navigation.navigate("Login");
    } else {
      ToastAndroid.show("Message delete failed!", ToastAndroid.SHORT);
    }
  };
  // Message delete end

  // Media picker start
  const pickMedia = async () => {
    let permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      ToastAndroid.show(
        "Permission to access media library is required!",
        ToastAndroid.SHORT
      );
      return;
    }

    setMessageSendingLoader(true);

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      if (selectedAsset.type === "video") {
        try {
          const fileSize = selectedAsset.fileSize;
          if (fileSize > MAX_FILE_SIZE) {
            ToastAndroid.show(
              "File size exceeds the 20MB limit!",
              ToastAndroid.SHORT
            );
            setMessageSendingLoader(false);
            return;
          }
        } catch (error) {
          ToastAndroid.show("Error loading video!", ToastAndroid.SHORT);
          setMessageSendingLoader(false);
          return;
        }
      }
      setSelectedMedia([...selectedMedia, result.assets[0]]);
    }
    setMessageSendingLoader(false);
  };
  // Media picker end

  // Media deselect start
  const deselectMedia = (uri) => {
    setSelectedMedia(selectedMedia.filter((imageUri) => imageUri.uri !== uri));
  };
  // Media deselect end

  // Handle message image preview start
  const handleMessageImagePreview = (imageUri) => {
    setMessageImagePreview(imageUri);
  };
  // Handle message image preview end

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        {/* User Profile */}
        <View style={styles.profileContainer}>
          <Avatar
            src={
              userProfile.blocked
                ? require("../../assets/profile.png")
                : userProfile.profile_picture
                ? BASE_URL + userProfile.profile_picture
                : null
            }
            name={userName}
            is_url={userProfile.blocked ? false : true}
          />
          {chatOn && !userProfile.other_blocked && (
            <View style={userStatus ? styles.onlineDot : styles.offlineDot} />
          )}
        </View>

        <Text
          onPress={() => setProfileModalVisible(true)}
          style={styles.username}
        >
          {userName}
        </Text>
        {/* Call and menu option */}
        <View style={styles.iconContainer}>
          <TouchableOpacity
            disabled={messageSendingLoader}
            onPress={handleAudioCall}
            style={styles.callIcon}
          >
            <MaterialIcons name="call" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={messageSendingLoader}
            onPress={handleVideoCall}
            style={styles.callIcon}
          >
            <MaterialIcons name="videocam" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={messageSendingLoader}
            onPress={toggleModal}
            style={styles.menuIcon}
          >
            <MaterialIcons name="more-vert" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        // Loader
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}></Text>
        </View>
      ) : (
        // Messages
        <SectionList
          sections={sections}
          renderItem={renderMessage}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id.toString()}
          ref={(ref) => {
            flatListRefs.current = ref;
          }}
          getMessageLayout={getMessageLayout}
          onScrollToIndexFailed={(info) => {
            if (info.index === sections.length - 1) {
              flatListRefs.current.scrollToLocation({
                sectionIndex: sections.length - 1,
                itemIndex: sections[sections.length - 1].data.length - 1,
                animated: true,
              });
            }
          }}
          contentContainerStyle={styles.messagesContainer}
        />
      )}

      {isTyping && (
        // Typing indicator
        <View style={styles.typingIndicatorContainer}>
          <Text style={styles.typingText}>typing</Text>
          <View style={styles.typingDotsContainer}>
            <Animated.View
              style={[styles.typingDot, { opacity: dot1Opacity }]}
            />
            <Animated.View
              style={[styles.typingDot, { opacity: dot2Opacity }]}
            />
            <Animated.View
              style={[styles.typingDot, { opacity: dot3Opacity }]}
            />
          </View>
        </View>
      )}

      {/* Menu options */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={toggleModal}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={() => handleMenuOption("profile")}>
              <Text style={styles.modalOption}>View profile</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity onPress={() => handleMenuOption("clear")}>
              <Text style={styles.modalOption}>Clear chat</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity onPress={() => handleMenuOption("block")}>
              <Text style={styles.modalOption}>
                {userProfile.other_blocked ? "Unblock user" : "Block User"}
              </Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity onPress={() => handleMenuOption("report")}>
              <Text style={styles.modalOption}>Report user</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* User profile view */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.profileModalBackground}>
          <View style={styles.profileModalContainer}>
            <TouchableOpacity
              onPress={() => setProfileModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            <Image
              source={require("../../assets/profile.png")}
              style={styles.profileImageLarge}
            />
            <Text style={styles.profileUsername}>{userName}</Text>
            <Text style={styles.profileDetail}>
              More details about the user...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Confirmation modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible ? true : false}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.confirmModalBackground}>
          <View style={styles.confirmModalContainer}>
            <Text style={styles.confirmModalHeading}>
              {confirmModalVisible === "clear"
                ? "Clear this chat?"
                : userProfile.other_blocked
                ? "Unblock this user?"
                : "Block this user?"}
            </Text>

            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmClearButton}
                onPress={() =>
                  confirmModalVisible === "clear"
                    ? clearChatMessages()
                    : userBlock()
                }
              >
                <Text style={styles.confirmClearText}>
                  {confirmModalVisible === "clear"
                    ? "Clear chat"
                    : userProfile.other_blocked
                    ? "Unblock"
                    : "Block"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.reportModalBackground}>
          <View style={styles.reportModalContainer}>
            <Text style={styles.reportModalHeading}>Report User</Text>

            <TextInput
              style={styles.reportInput}
              placeholder="Describe the issue..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />

            <View style={styles.reportButtonContainer}>
              <TouchableOpacity
                style={styles.reportCancelButton}
                onPress={() => setReportModalVisible(false)}
              >
                <Text style={styles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportSubmitButton}
                onPress={() => reportUser()}
              >
                <Text style={styles.reportSubmitText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Message image preview Modal */}
      <Modal
        visible={messageImagePreview !== null}
        transparent={true}
        onRequestClose={() => setMessageImagePreview(null)}
      >
        <View style={styles.messageImagePrevModalContainer}>
          <TouchableOpacity
            style={styles.closeMessageImagePrevModalButton}
            onPress={() => setMessageImagePreview(null)}
          >
            <MaterialIcons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{ uri: messageImagePreview }}
            style={styles.messageImagePrev}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Selected media */}
      {selectedMedia.length > 0 && !messageSendingLoader && (
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.imagePreviewContainer}
          contentContainerStyle={{ alignItems: "center" }}
        >
          {selectedMedia.map((imageUri, index) => (
            <View key={index} style={styles.selectedImageContainer}>
              <Image
                source={{ uri: imageUri?.uri }}
                style={styles.selectedImage}
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => deselectMedia(imageUri?.uri)}
              >
                <MaterialIcons name="cancel" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Message input */}
      <View style={styles.inputContainer}>
        {chatOn && !userProfile.other_blocked && (
          <>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={handleTextInputChange}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              editable={
                selectedMedia.length > 0 || messageSendingLoader ? false : true
              }
            />

            {/* Button for picking media */}
            <TouchableOpacity
              onPress={pickMedia}
              style={styles.mediaButton}
              disabled={newMessage != "" || messageSendingLoader ? true : false}
            >
              <MaterialIcons
                name="image"
                size={45}
                color={
                  newMessage || messageSendingLoader ? "#d3d3d3" : "#009387"
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              disabled={
                messageSendingLoader
                  ? true
                  : selectedMedia.length === 0
                  ? !newMessage
                    ? true
                    : false
                  : false
              }
              onPress={sendMessage}
              style={[
                styles.sendButton,
                {
                  backgroundColor: messageSendingLoader
                    ? "#d3d3d3"
                    : newMessage || selectedMedia.length > 0
                    ? "#009387"
                    : "#d3d3d3",
                },
              ]}
            >
              {messageSendingLoader ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 35,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  backButton: {
    paddingRight: 10,
  },
  profileContainer: {
    position: "relative",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "green",
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#fff",
  },
  offlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "red",
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#fff",
  },
  username: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginLeft: 10,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  callIcon: {
    paddingHorizontal: 10,
  },
  menuIcon: {
    padding: 10,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "bold",
    padding: 10,
    backgroundColor: "#f0f0f0",
    textAlign: "center",
  },
  messageList: {
    backgroundColor: "#fff",
  },
  messagesContainer: {
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: "75%",
    marginLeft: 5,
    marginRight: 5,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ECECEC",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
  },
  messageVideo: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  messageImagePrevModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  messageImagePrev: {
    width: "100%",
    height: "100%",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 5,
  },
  messageTime: {
    fontSize: 12,
    color: "#999",
    marginRight: 5,
  },
  messageStatusIcon: {
    marginLeft: 5,
  },
  typingIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 20,
    maxWidth: 100,
  },
  typingText: {
    color: "#000",
    fontWeight: "bold",
    marginRight: 5,
  },
  typingDotsContainer: {
    flexDirection: "row",
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#555",
    marginHorizontal: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  modalBackground: {
    flex: 1,
    alignSelf: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 45,
    marginRight: 7,
    width: 150,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOption: {
    fontSize: 18,
    paddingVertical: 10,
    textAlign: "center",
  },
  separator: {
    height: 0.5,
    backgroundColor: "#e0e0e0",
  },
  closeButton: {
    borderRadius: 5,
    alignItems: "center",
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#000",
    borderRadius: 15,
    padding: 5,
  },
  closeMessageImagePrevModalButton: {
    borderRadius: 5,
    alignItems: "center",
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#000",
    borderRadius: 15,
    padding: 5,
    zIndex: 1,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    position: "relative",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 10,
    marginRight: 10,
  },
  mediaButton: {
    marginRight: 10,
  },
  sendButton: {
    borderRadius: 20,
    padding: 10,
  },
  selectedMediaContainer: {
    position: "absolute",
    top: -50,
    left: 10,
    width: 60,
    height: 60,
  },
  selectedMedia: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imagePreviewContainer: {
    flexDirection: "row",
    height: 80,
    maxHeight: 80,
    marginLeft: 10,
    marginRight: 10,
  },
  selectedImageContainer: {
    marginRight: 10,
    width: 60,
    height: 60,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  cancelButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 2,
  },
  profileModalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  profileModalContainer: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  profileDetail: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  confirmModalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  confirmModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmModalHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  confirmCancelButton: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#009387",
  },
  confirmCancelText: {
    color: "#009387",
    fontSize: 16,
  },
  confirmClearButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#009387",
    borderRadius: 5,
  },
  confirmClearText: {
    color: "#fff",
    fontSize: 16,
  },
  reportModalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  reportModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reportModalHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  reportInput: {
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  reportButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  reportCancelButton: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#009387",
  },
  reportCancelText: {
    color: "#009387",
    fontSize: 16,
  },
  reportSubmitButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#009387",
    borderRadius: 5,
  },
  reportSubmitText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default Chat;
