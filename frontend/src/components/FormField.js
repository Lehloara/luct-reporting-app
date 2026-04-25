import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function FormField({ 
  label, value, onChangeText, placeholder, 
  type = 'text', multiline = false, numberOfLines = 1, editable = true 
}) {
  const keyboardType = type === 'number' ? 'numeric' : 'default';
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        autoCapitalize="sentences"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 6, color: '#333', fontSize: 14 },
  input: { 
    backgroundColor: '#fff', padding: 14, borderRadius: 10, 
    borderWidth: 1, borderColor: '#e0e0e0', fontSize: 15, color: '#1a1a1a' 
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' }
});