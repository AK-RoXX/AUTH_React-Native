// app/onboarding.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { register, updateUserProfile } = useAuth();

  const navigateToLogin = () => {
    router.replace('/login' as any);
  };

  const handleRegister = async () => {
    // Input validation
    if (!firstName || !lastName || !contactNumber || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Phone validation - adjust regex as needed for your country format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(contactNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Register the user
      await register(email, password);
      
      // Store additional user info (firstName, lastName, contactNumber)
      await updateUserProfile({
        firstName,
        lastName,
        contactNumber,
        email
      });
      
      // Navigation will be handled by auth state change listener
    } catch (error: any) {
      Alert.alert('Registration Error', error.message);
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#e0f7fa', '#ffffff']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Please fill in your details</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              autoCapitalize="words"
            />
            
            <TextInput
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              autoCapitalize="words"
            />
            
            <TextInput
              placeholder="Contact Number"
              value={contactNumber}
              onChangeText={setContactNumber}
              style={styles.input}
              keyboardType="phone-pad"
            />
            
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
            />
            
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry
            />
          </View>
          
          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#0782F9" />
            ) : (
              <TouchableOpacity 
                style={styles.button}
                onPress={handleRegister}
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0782F9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#0782F9',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    color: '#555',
    fontSize: 16,
  },
  loginLink: {
    color: '#0782F9',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
});