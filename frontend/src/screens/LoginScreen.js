import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import { login } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Validation Error', 'Email and Password are required');
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      let message = error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address';
      }
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            fadeDuration={300}
          />
          <Text style={styles.appName}>LUCT Reporting System</Text>
          <Text style={styles.appSubtitle}>Students and Staff Portal</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@luct.ls"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />
        </View>

        <TouchableOpacity style={styles.forgotLink} onPress={() => Alert.alert('Info', 'Contact your Program Leader for password reset')}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled]} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Register here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 8,
  },
  logo: {
    width: 300,
    height: 90,
    marginBottom: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  inputGroup: { marginBottom: 16 },
  label: { 
    fontWeight: '600', 
    marginBottom: 6, 
    color: '#333',
    fontSize: 14
  },
  input: { 
    backgroundColor: '#f8f9fa',
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    fontSize: 15,
    color: '#1a1a1a'
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  btn: { 
    backgroundColor: '#007AFF', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  btnDisabled: { backgroundColor: '#a0c4ff' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: { color: '#666', fontSize: 14 },
  linkText: { color: '#007AFF', fontWeight: '600', fontSize: 14 },
});