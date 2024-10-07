import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export const Button = ({ onPress, children }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
};