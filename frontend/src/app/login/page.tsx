'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BuildingStorefrontIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function LoginForm() {
  const { login, signup, sendMagicLink, isProcessingMagicLink } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
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
      if (isMagicLink) {
        await sendMagicLink(email);
        toast.success('Check your email for the magic link!');
        return;
      }
      
      if (isSignup) {
        await signup(email, password, `${firstName} ${lastName}`);
      } else {
        await login(email, password);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      if (isMagicLink) {
        toast.error('Failed to send magic link. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (mode: 'signup' | 'login' | 'magic-link') => {
    setError('');
    setIsSignup(mode === 'signup');
    setIsMagicLink(mode === 'magic-link');
    // Update URL without refreshing the page
    const newUrl = mode === 'signup' ? '/login?signup=true' : '/login';
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
              {isSignup && !isMagicLink && (
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
              {!isMagicLink && (
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
              )}
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
                {isLoading || isProcessingMagicLink ? (
                  'Loading...'
                ) : isMagicLink ? (
                  'Send Magic Link'
                ) : isSignup ? (
                  'Sign up'
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-sm text-center space-y-2">
              {!isMagicLink && (
                <button
                  type="button"
                  onClick={() => toggleMode(isSignup ? 'login' : 'signup')}
                  className="font-medium text-[#2A9D8F] hover:text-[#40B4A6] block w-full"
                >
                  {isSignup
                    ? 'Already have an account? Login'
                    : "Don't have an account? Sign up"}
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleMode(isMagicLink ? 'login' : 'magic-link')}
                className="font-medium text-[#2A9D8F] hover:text-[#40B4A6] flex items-center justify-center gap-2 w-full"
              >
                {isMagicLink ? (
                  'Back to password login'
                ) : (
                  <>
                    <EnvelopeIcon className="h-4 w-4" />
                    Sign in with magic link
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2EB]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#2A9D8F]"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
} 