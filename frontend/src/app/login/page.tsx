'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set signup mode if signup=true in URL
    setIsSignup(searchParams.get('signup') === 'true');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignup) {
        await signup(email, password, `${firstName} ${lastName}`);
      } else {
        await login(email, password);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setIsSignup(!isSignup);
    // Update URL without refreshing the page
    const newUrl = !isSignup ? '/login?signup=true' : '/login';
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F2EB] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 group">
          <BuildingStorefrontIcon className="h-7 w-7 text-[#2A9D8F] group-hover:text-[#40B4A6] transition-colors" />
          <span className="text-2xl font-bold font-display text-[#2A9D8F] group-hover:text-[#40B4A6] transition-colors">localmart</span>
        </Link>
      </div>
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-8">
          <h2 className="text-center text-3xl font-bold text-[#2D3748] mb-8">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {isSignup && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="sr-only">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-[#2A9D8F]/20 rounded-md placeholder-[#4A5568] text-[#2D3748] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent bg-white/50"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="sr-only">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-[#2A9D8F]/20 rounded-md placeholder-[#4A5568] text-[#2D3748] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent bg-white/50"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-[#2A9D8F]/20 rounded-md placeholder-[#4A5568] text-[#2D3748] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent bg-white/50"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-[#2A9D8F]/20 rounded-md placeholder-[#4A5568] text-[#2D3748] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent bg-white/50"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-[#2A9D8F] hover:bg-[#40B4A6] active:bg-[#1E7268] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A9D8F] transition-colors duration-200"
              >
                {isLoading ? (
                  'Loading...'
                ) : isSignup ? (
                  'Sign up'
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-sm text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="font-medium text-[#2A9D8F] hover:text-[#40B4A6]"
              >
                {isSignup
                  ? 'Already have an account? Login'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 