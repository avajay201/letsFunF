import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ToastAndroid,
  ActivityIndicator,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import MyLayout from "./MyLayout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userProfile, updateUserProfile } from "../actions/APIActions";
import { BASE_URL } from "../actions/API";
import { MainContext } from "../others/MyContext";


export default function Profile({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [profileEditData, setProfileEditData] = useState(profileData);
  const { setIsLogged } = useContext(MainContext);

  // Get profile start
  useEffect(()=>{
    const fetchProfile = async()=>{
      const response = await userProfile();
      if (response[0] === 200){
        setProfileData(response[1]);
        setProfileEditData(response[1]);
      }
      else if(response[0] === 401){
        ToastAndroid.show('Session expired, please login.', ToastAndroid.SHORT);
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('auth_user');
        navigation.navigate('Login');
      }
      else{
        ToastAndroid.show('Something went wrong.', ToastAndroid.SHORT);
      }
    };
    fetchProfile();
  }, []);
  // Get profile end

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  // Save profile start
  const handleSaveProfile = async() => {
    setLoading(true);

    const formData = new FormData();
    if (profileEditData.profile_picture && !profileEditData.profile_picture.startsWith('/media')) {
      const uriParts = profileEditData.profile_picture.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('profile_picture', {
        uri: profileEditData.profile_picture,
        name: `profile.${fileType}`,
        type: `image/${fileType}`,
      });
    };
    formData.append('first_name', profileEditData.first_name);
    formData.append('last_name', profileEditData.last_name);
    formData.append('dob', profileEditData.dob);
    formData.append('gender', profileEditData.gender);
    formData.append('location', profileEditData.location);

    const response = await updateUserProfile(formData);
    if (response[0] === 200){
      setProfileData(response[1]);
      setProfileEditData(response[1]);
      ToastAndroid.show('Profile updated successfully.', ToastAndroid.SHORT);
    }
    else if(response[0] === 401){
      ToastAndroid.show('Session expired, please login.', ToastAndroid.SHORT);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      navigation.navigate('Login');
    }
    else{
      ToastAndroid.show('Something went wrong.', ToastAndroid.SHORT);
    }
    setIsEditing(false);
    setLoading(false);
  };
  // Save profile end

  // Handle dob change start
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || profileEditData.dob;
    setShowDatePicker(false);
    setProfileEditData({ ...profileEditData, dob: currentDate.toISOString().split('T')[0] });
  };
  // Handle dob change end

  // Handle input change start
  const handleInputChange = (field, value) => {
    setProfileEditData({ ...profileEditData, [field]: value });
  };
  // Handle input change end

  // Handle profile picture start
  const handleEditPicture = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      ToastAndroid.show("Media permission error.", ToastAndroid.SHORT);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setProfileEditData({ ...profileEditData, profile_picture: result?.assets[0].uri });
    }
  };
  // Handle profile picture end

  // Format dob start
  const formatDate = (date) => {
    const dateObj = new Date(date)
    const options = { year: 'numeric', month: 'long', day: '2-digit' };
    return dateObj.toLocaleDateString('en-US', options).replace(',', '');
  };
  // Format dob end

  // Logout start
  const handleLogout = async()=>{
    try{
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      ToastAndroid.show('Logout successfully.', ToastAndroid.SHORT);
      setIsLogged('logout');
      navigation.navigate('Login');
    }
    catch(error){
      ToastAndroid.show('Something went wrong.', ToastAndroid.SHORT);
    }
  };
  // Logout end

  // Cancle update start
  const handleCancleUpadte = ()=>{
    setProfileEditData(profileData);
    setIsEditing(false);
  };
  // Cancle update end

  return (
    <MyLayout>
      {!isEditing ? (
        // Profile view
        <View style={styles.container}>
          <Animatable.View
            animation="fadeInDown"
            duration={1500}
            style={styles.header}
          >
            <Text style={styles.title}>Profile</Text>
          </Animatable.View>

          <Animatable.View
            animation="fadeInUp"
            duration={1500}
            style={styles.footer}
          >
            <ScrollView>
              <View style={styles.profileContainer}>
                <Animatable.Image
                  animation="zoomIn"
                  duration={1500}
                  source={
                    profileData.profile_picture
                      ? { uri: profileData.profile_picture.startsWith('http') ? profileData.profile_picture : BASE_URL + profileData.profile_picture }
                      : require('../assets/profile.png')
                  }
                  style={styles.profileImage}
                />
                <Text style={styles.name}>
                  {profileData.first_name} {profileData.last_name}
                </Text>
                <Text style={styles.bio}>{profileData.username}</Text>
                <View style={styles.profileAction}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditProfile}
                  >
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleLogout}
                  >
                    <Text style={styles.editButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Animatable.View animation="fadeInUp" duration={1500}>
                <View style={styles.detailsCard}>
                  <Ionicons name="mail-outline" size={24} color="#009387" />
                  <View style={styles.infoBox}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.infoText}>{profileData.email}</Text>
                  </View>
                </View>

                <View style={styles.detailsCard}>
                  <Ionicons name="time-outline" size={24} color="#009387" />
                  <View style={styles.infoBox}>
                    <Text style={styles.label}>DOB</Text>
                    <Text style={styles.infoText}>{profileData.dob ? formatDate(profileData.dob) : null}</Text>
                  </View>
                </View>

                <View style={styles.detailsCard}>
                  <Ionicons name="male-female" size={24} color="#009387" />
                  <View style={styles.infoBox}>
                    <Text style={styles.label}>Gender</Text>
                    <Text style={styles.infoText}>{profileData.gender}</Text>
                  </View>
                </View>

                <View style={styles.detailsCard}>
                  <Ionicons name="location-outline" size={24} color="#009387" />
                  <View style={styles.infoBox}>
                    <Text style={styles.label}>Location</Text>
                    <Text style={styles.infoText}>{profileData.location}</Text>
                  </View>
                </View>
              </Animatable.View>
            </ScrollView>
          </Animatable.View>
        </View>
      ) : (
        // Profile edit view
        <View style={styles.container}>
          <Animatable.View
            animation="fadeInDown"
            duration={1500}
            style={styles.header}
          >
            <Text style={styles.title}>Profile</Text>
            {isEditing && <TouchableOpacity style={styles.cancelProfileUpdate} disabled={loading} onPress={handleCancleUpadte}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>}
          </Animatable.View>

          <Animatable.View
            animation="fadeInUp"
            duration={1500}
            style={styles.footer}
          >
            <ScrollView>
              <View style={styles.formContainer}>
                <Animatable.View
                  animation="zoomIn"
                  duration={1500}
                  style={styles.profileImageContainer}
                >
                  <Image
                    source={
                      profileEditData.profile_picture
                      ? profileEditData.profile_picture.startsWith('/media')
                        ? { uri: BASE_URL + profileEditData.profile_picture }
                        : { uri: profileEditData.profile_picture }
                      : require('../assets/profile.png')
                    }
                    style={styles.profileImage}
                    editable={!loading}
                  />
                  <TouchableOpacity style={styles.cameraIconContainer} disabled={loading} onPress={handleEditPicture}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </TouchableOpacity>
                </Animatable.View>

                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={profileEditData.first_name}
                  onChangeText={(text) => handleInputChange("first_name", text)}
                  editable={!loading}
                />

                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={profileEditData.last_name}
                  onChangeText={(text) => handleInputChange("last_name", text)}
                  editable={!loading}
                />

                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>{profileEditData.dob ? formatDate(profileEditData.dob) : null}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(profileEditData.dob)}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    editable={!loading}
                  />
                )}

                <Text style={styles.label}>Gender</Text>
                <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={profileEditData.gender}
                  style={styles.picker}
                  onValueChange={(itemValue) => handleInputChange('gender', itemValue)}
                  enabled={!loading}
                >
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>

                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Location"
                  value={profileEditData.location}
                  editable={!loading}
                  onChangeText={(text) => handleInputChange("location", text)}
                />

                {loading ? (
                  <ActivityIndicator size="large" color="#009387" style={styles.loader} />
                ) : (
                  <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Animatable.View>
        </View>
      )}
    </MyLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#009387",
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  footer: {
    flex: 3,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  bio: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  editButton: {
    backgroundColor: "#009387",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  profileAction: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  detailsCard: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  infoBox: {
    marginLeft: 15,
  },
  label: {
    color: "#666",
    fontSize: 14,
  },
  infoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#05375a",
    marginTop: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
    marginBottom: 20,
    fontSize: 16,
    paddingBottom: 5,
    color: "#05375a",
  },
  datePickerButton: {
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
    marginBottom: 20,
    paddingVertical: 5,
  },
  dateText: {
    fontSize: 16,
    color: "#05375a",
  },
  saveButton: {
    backgroundColor: "#009387",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  profileImageContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 10,
    left: "55%",
    backgroundColor: "#009387",
    borderRadius: 20,
    padding: 5,
  },
  cancelProfileUpdate: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 5,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#05375a',
  },
});
