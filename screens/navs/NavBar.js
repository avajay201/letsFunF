import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const NavBar = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const renderNavItem = (screen, label, icon, activeIcon) => {
    const isActive = route.name === screen;
    return (
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate(screen)}
      >
        <Ionicons
          name={isActive ? activeIcon : icon}
          size={24}
          color={isActive ? '#FF6347' : '#8e8e8e'}
        />
        <Text style={isActive ? styles.activeLabel : styles.label}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.navbarContainer}>
      {renderNavItem('Home', 'Home', 'home-outline', 'home')}
      {renderNavItem('Calls', 'Calls', 'call-outline', 'call')}
      {renderNavItem('Profile', 'Profile', 'person-outline', 'person')}
    </View>
  );
};

const styles = StyleSheet.create({
  navbarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 5,
    paddingRight: 5,
  },
  label: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 2,
  },
  activeLabel: {
    fontSize: 12,
    color: '#FF6347',
    fontWeight: 'bold',
    marginTop: 2,
  },
});

export default NavBar;
