import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

const ErrorMessage = ({ message }) => {
  return (
    <Animatable.View animation="fadeIn" duration={500} style={styles.container}>
      <Text style={styles.errorText}>{message}</Text>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffdddd',
    borderColor: '#ff0000',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
  },
});

export default ErrorMessage;
