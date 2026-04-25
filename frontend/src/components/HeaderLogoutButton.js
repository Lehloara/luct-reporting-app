import React from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HeaderLogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={styles.btn}>
      <Text style={styles.text}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { marginRight: 12, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6 },
  text: { color: '#dc3545', fontWeight: '600', fontSize: 14 }
});