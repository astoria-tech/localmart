'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for saved auth data on mount
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      setUser(JSON.parse(savedAuth));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:8000/api/v0/auth/login', {
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
      name: data.user.name,
      token: data.token,
    };

    setUser(userData);
    localStorage.setItem('auth', JSON.stringify(userData));
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await fetch('http://localhost:8000/api/v0/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        passwordConfirm: password,
        name,
      }),
    });

    if (!response.ok) {
      throw new Error('Signup failed');
    }

    const data = await response.json();
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      token: data.token,
    };

    setUser(userData);
    localStorage.setItem('auth', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
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