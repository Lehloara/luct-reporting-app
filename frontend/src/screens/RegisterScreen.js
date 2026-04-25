import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { register } from '../services/authService';

const ROLES = [
  { label: 'Student', value: 'student' },
  { label: 'Lecturer', value: 'lecturer' },
  { label: 'Principal Lecturer (PRL)', value: 'prl' },
  { label: 'Program Leader (PL)', value: 'pl' }
];

const FACULTIES = [
  { label: 'Select Faculty', value: '' },
  { label: 'FICT', value: 'FICT' },
  { label: 'FABE', value: 'FABE' },
  { label: 'FBMG', value: 'FBMG' },
  { label: 'FCTH', value: 'FCTH' },
  { label: 'FDI', value: 'FDI' },
  { label: 'FCMB', value: 'FCMB' }
];

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [faculty, setFaculty] = useState('');
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return Alert.alert('Validation Error', 'All fields are required');
    if (password.length < 6) return Alert.alert('Validation Error', 'Password must be at least 6 characters');
    if (!faculty) return Alert.alert('Validation Error', 'Please select your faculty');
    if (role === 'student' && !classCode.trim()) return Alert.alert('Validation Error', 'Class code is required for students');

    setLoading(true);
    try {
      await register(email, password, name.trim(), role, faculty, role === 'student' ? classCode.toUpperCase() : null);
      Alert.alert('Success', 'Account created! Please login.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        
        <View style={styles.inputGroup}><Text style={styles.label}>Full Name</Text><TextInput style={styles.input} placeholder="Enter your full name" value={name} onChangeText={setName} autoCapitalize="words" /></View>
        <View style={styles.inputGroup}><Text style={styles.label}>Email Address</Text><TextInput style={styles.input} placeholder="you@luct.edu.my" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></View>
        <View style={styles.inputGroup}><Text style={styles.label}>Password</Text><TextInput style={styles.input} placeholder="Min. 6 characters" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" /></View>
        
        <View style={styles.inputGroup}><Text style={styles.label}>Faculty</Text>
          <View style={styles.pickerContainer}><Picker selectedValue={faculty} onValueChange={setFaculty} style={styles.picker}>{FACULTIES.map(f => <Picker.Item key={f.value} label={f.label} value={f.value} color={f.value ? '#333' : '#999'} />)}</Picker></View>
        </View>

        <View style={styles.inputGroup}><Text style={styles.label}>User Role</Text>
          <View style={styles.pickerContainer}><Picker selectedValue={role} onValueChange={setRole} style={styles.picker}>{ROLES.map(r => <Picker.Item key={r.value} label={r.label} value={r.value} color="#333" />)}</Picker></View>
        </View>

        {role === 'student' && (
          <View style={styles.inputGroup}><Text style={styles.label}>Class Code</Text><TextInput style={styles.input} placeholder="e.g., BSCSMY3S2" value={classCode} onChangeText={setClassCode} autoCapitalize="characters" /></View>
        )}

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}><Text style={styles.linkText}>← Back to Login</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f5f7fa', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  inputGroup: { marginBottom: 14 },
  label: { fontWeight: '600', marginBottom: 6, color: '#333', fontSize: 14 },
  input: { backgroundColor: '#f8f9fa', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', fontSize: 15 },
  pickerContainer: { backgroundColor: '#f8f9fa', borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', overflow: 'hidden' },
  picker: { height: Platform.OS === 'ios' ? 50 : 55, width: '100%' },
  btn: { backgroundColor: '#34C759', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: '#a0c4ff' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backLink: { alignItems: 'center', marginTop: 16 },
  linkText: { color: '#007AFF', fontWeight: '500', fontSize: 14 }
});