import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, ToastAndroid } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useFocusEffect } from '@react-navigation/native';
import ErrorMessage from '../comps/ErrorMessage';
import { userRegister } from '../../actions/APIActions';


export default function Register({ navigation }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useFocusEffect(
    React.useCallback(() => {
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setError('');
    }, [])
  );

  // Handle register start
  const handleRegister = async() => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{5,14}$/;

    if (!email || !username || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
    };

    if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
    };

    if (!usernameRegex.test(username)) {
        setError('Username must start with a letter and can only contain letters, numbers, and underscores, with a length of 6 to 15 characters.');
        return;
    };

    if (username.length < 6 || username.length > 15) {
        setError('Username must be between 6 and 15 characters.');
        return;
    };

    if (password.length < 6 || password.length > 20) {
        setError('Password must be between 6 and 20 characters.');
        return;
    };

    if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
    };

    const registerData = {username: username, email: email, password: password};
    setLoading(true);
    const response = await userRegister(registerData);
    if (response[0] === 400){
      const values = Object.values(response[1]);
      setError(values[0]);
    }
    else if(response[0] === 201){
      setLoading(false);
      ToastAndroid.show('Registration completed successfully.', ToastAndroid.SHORT);
      navigation.navigate('Login');
    }
    else{
      setError('Something went wrong.');
    }
    setLoading(false);
  };
  // Handle register end

  // Clear error start
  const clearError = () => {
    if (error) {
      setError('');
    };
  };
  // Clear error end

  return (
    <View style={styles.container}>
      <Animatable.View animation="fadeInDown" duration={1500} style={styles.header}>
        <Text style={styles.title}>Create an Account</Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={1500} style={styles.footer}>
        {error ? <ErrorMessage message={error} /> : null}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearError();
          }}
          editable={!loading}
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            clearError();
          }}
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearError();
          }}
          editable={!loading}
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            clearError();
          }}
          editable={!loading}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#009387" style={styles.loader} />
        ) : (
          <Animatable.View animation="zoomIn" duration={1500}>
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}

        <TouchableOpacity disabled={loading} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.loginText, loading ? styles.disabledText : {}]}>Already have an account? Login</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#009387',
    justifyContent: 'center',
  },
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  footer: {
    flex: 3,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  label: {
    color: '#05375a',
    fontSize: 18,
    marginTop: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    marginBottom: 20,
    fontSize: 16,
    paddingBottom: 5,
    color: '#05375a',
  },
  button: {
    backgroundColor: '#009387',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 20,
    color: '#009387',
    textAlign: 'center',
  },
  disabledText: {
    color: '#d3d3d3',
  },
});
