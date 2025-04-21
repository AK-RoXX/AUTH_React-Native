// app/(tabs)/index.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const Dashboard = () => {
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <LinearGradient
      colors={['#e0f7fa', '#ffffff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>
              Welcome, {userProfile?.firstName || user?.email?.split('@')[0] || 'User'}!
            </Text>
            <Text style={styles.subText}>
              We're glad to see you again
            </Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Profile</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>
                {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Not set'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{user?.email || 'Not set'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>{userProfile?.contactNumber || 'Not set'}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleLogout} style={styles.button}>
            <Text style={styles.buttonText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginVertical: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0782F9',
  },
  subText: {
    fontSize: 16,
    color: '#555',
    marginTop: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    width: '30%',
    color: '#666',
  },
  value: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  button: {
    backgroundColor: '#0782F9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});