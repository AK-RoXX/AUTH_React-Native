// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen 
          name="splash" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}