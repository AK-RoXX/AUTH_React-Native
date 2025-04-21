// app/splash.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace('/onboarding' as any);
  };

  const navigateToLogin = () => {
    router.replace('/login' as any);
  };

  return (
    <LinearGradient
      colors={['#e0f7fa', '#ffffff']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animatable.Image
          animation="bounceIn"
          duration={1500}
          source={require('../assets/images/icon.jpg')}
          style={styles.logo}
        />

        <Animatable.Text animation="fadeInDown" delay={300} style={styles.title}>
          Welcome to Complaints Portal
        </Animatable.Text>

        <Animatable.Text animation="fadeInDown" delay={500} style={styles.subtitle}>
          Report Issues with Ease
        </Animatable.Text>

        <Animatable.View animation="fadeInUp" delay={800} style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0782F9',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 60,
    textAlign: 'center',
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
    width: '80%',
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
