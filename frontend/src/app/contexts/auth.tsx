'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { config } from '@/config';
import { useSignIn } from '@clerk/nextjs';

interface User {
  id: string;
  email: string;
  name: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  sendMagicLink: (email: string) => Promise<void>;
  isProcessingMagicLink: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isProcessingMagicLink, setIsProcessingMagicLink] = useState(false);
  const { signIn, isLoaded: isClerkLoaded } = useSignIn();

  useEffect(() => {
    // Check for saved auth data on mount
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      setUser(JSON.parse(savedAuth));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${config.apiUrl}/api/v0/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: `${data.user.first_name} ${data.user.last_name}`.trim(),
      token: data.token,
    };

    setUser(userData);
    localStorage.setItem('auth', JSON.stringify(userData));
  };

  const signup = async (email: string, password: string, name: string) => {
    // Split name into first and last name
    const [first_name, ...lastNameParts] = name.trim().split(' ');
    const last_name = lastNameParts.join(' ') || ''; // Join remaining parts or empty string

    const response = await fetch(`${config.apiUrl}/api/v0/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        passwordConfirm: password,
        first_name,
        last_name
      }),
    });

    if (!response.ok) {
      throw new Error('Signup failed');
    }

    const data = await response.json();
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: `${data.user.first_name} ${data.user.last_name}`.trim(),
      token: data.token,
    };

    setUser(userData);
    localStorage.setItem('auth', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth');
  };

  const sendMagicLink = async (email: string) => {
    if (!isClerkLoaded) return;
    
    try {
      setIsProcessingMagicLink(true);
      await signIn.create({
        strategy: 'email_link',
        identifier: email,
        redirectUrl: `${window.location.origin}/login`,
      });
    } catch (error) {
      console.error('Error sending magic link:', error);
      throw error;
    } finally {
      setIsProcessingMagicLink(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout,
      sendMagicLink,
      isProcessingMagicLink
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 