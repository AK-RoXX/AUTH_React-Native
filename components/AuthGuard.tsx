// components/AuthGuard.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

// List of routes that don't require authentication
const publicRoutes = ['/login'];

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip redirect during initial loading
    if (loading) return;

    const requiresAuth = !publicRoutes.some(route => pathname === route || pathname.startsWith(route));

    // If it's a protected route and user is not logged in,
    // redirect to login page
    if (requiresAuth && !user) {
      // Fix: Use a type assertion or define proper route types
      router.replace('/login' as any);
    }

    // If user is logged in and tries to access login page,
    // redirect to home
    if (user && pathname === '/login') {
      // Fix: Use a type assertion or define proper route types
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0782F9" />
      </View>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;