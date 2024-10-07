import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ToastAndroid } from 'react-native';
import * as Animatable from 'react-native-animatable';
import ErrorMessage from '../comps/ErrorMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userLogin } from '../../actions/APIActions';
import { MainContext } from '../../others/MyContext';


export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setIsLogged } = useContext(MainContext);

  // Handle login start
  const handleLogin = async() => {
    setError('');
    if (!email || !password) {
        setError('Username and password are required fields.');
        return;
    };

    setLoading(true);
    const loginData = {email: email, password: password};
    const response = await userLogin(loginData,);
    if (response[0] === 400){
      setError(response[1]);
    }
    else if(response[0] === 200){
      await AsyncStorage.setItem('auth_token', response[1]?.access);
      await AsyncStorage.setItem('auth_user', response[1]?.username);
      setLoading(false);
      ToastAndroid.show('Login successfully.', ToastAndroid.SHORT);
      setIsLogged(true);
      navigation.replace('Home');
    }
    else{
      setError('Something went wrong.');
    }
    setLoading(false);
  };
  // Handle login end

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
        <Text style={styles.title}>Welcome Back</Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={1500} style={styles.footer}>
        {error ? <ErrorMessage message={error} /> : null}
        <Text style={styles.label}>Email/Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email/username"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
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

        {loading ? (
          <ActivityIndicator size="large" color="#009387" style={styles.loader} />
        ) : (
        <Animatable.View animation="zoomIn" duration={1500}>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Animatable.View>
        )}
        <TouchableOpacity disabled={loading} onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.registerText, loading ? styles.disabledText : {}]}>Don't have an account? Register</Text>
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
  registerText: {
    marginTop: 20,
    color: '#009387',
    textAlign: 'center',
  },
  disabledText: {
    color: '#d3d3d3',
  },
});
