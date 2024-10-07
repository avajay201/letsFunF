import React from 'react';
import { View, Image, Text } from 'react-native';

export const Avatar = ({ src, name, is_url }) => {
  return (
    <View style={{ height: 40, width: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#E0E0E0' }}>
      {src ? (
        <Image source={is_url ? { uri: src } : src} style={{ height: '100%', width: '100%' }} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
};
