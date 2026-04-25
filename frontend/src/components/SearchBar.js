import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export default function SearchBar({ placeholder = 'Search...', value, onChangeText }) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  input: { 
    backgroundColor: '#f5f7fa', padding: 12, borderRadius: 10, fontSize: 15, 
    borderWidth: 1, borderColor: '#ddd', color: '#1a1a1a' 
  }
});