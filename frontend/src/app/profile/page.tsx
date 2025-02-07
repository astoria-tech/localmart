'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth';
import { toast } from 'react-hot-toast';

interface UserProfile {
  first_name: string;
  last_name: string;
  phone_number: string;
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  zip: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    phone_number: '',
    street_1: '',
    street_2: '',
    city: '',
    state: '',
    zip: ''
  });

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setProfile(prev => ({ ...prev, phone_number: formattedNumber }));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.token) return;

      try {
        const response = await fetch(`http://localhost:8000/api/v0/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
          street_1: data.street_1 || '',
          street_2: data.street_2 || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;

    setSaving(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v0/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F2EB] pt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-white/50 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-white/50 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2EB] pt-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#2D3748]">Profile Settings</h1>
            <p className="mt-2 text-[#4A5568]">Manage your account information and delivery preferences</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#2D3748] mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2A9D8F]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-[#2D3748]">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-[#2A9D8F]/20 bg-white/50 py-2.5 px-3 shadow-sm focus:border-[#2A9D8F] focus:outline-none focus:ring-1 focus:ring-[#2A9D8F] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-[#2D3748]">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-[#2A9D8F]/20 bg-white/50 py-2.5 px-3 shadow-sm focus:border-[#2A9D8F] focus:outline-none focus:ring-1 focus:ring-[#2A9D8F] transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="phone_number" className="block text-sm font-medium text-[#2D3748]">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    value={profile.phone_number}
                    onChange={handlePhoneChange}
                    maxLength={14}
                    className="mt-1 block w-full rounded-lg border border-[#2A9D8F]/20 bg-white/50 py-2.5 px-3 shadow-sm focus:border-[#2A9D8F] focus:outline-none focus:ring-1 focus:ring-[#2A9D8F] transition-colors"
                    placeholder="(555) 555-5555"
                    pattern="\(\d{3}\) \d{3}-\d{4}"
                    title="Phone number in format: (XXX) XXX-XXXX"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#2D3748] mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2A9D8F]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Delivery Address
              </h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="street1" className="block text-sm font-medium text-[#2D3748]">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="street1"
                    value={profile.street_1}
                    onChange={(e) => setProfile(prev => ({ ...prev, street_1: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-[#2A9D8F]/20 bg-white/50 py-2.5 px-3 shadow-sm focus:border-[#2A9D8F] focus:outline-none focus:ring-1 focus:ring-[#2A9D8F] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="street2" className="block text-sm font-medium text-[#2D3748]">
                    Apartment, suite, etc.
                  </label>
                  <input
                    type="text"
                    id="street2"
                    value={profile.street_2}
                    onChange={(e) => setProfile(prev => ({ ...prev, street_2: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-[#2A9D8F]/20 bg-white/50 py-2.5 px-3 shadow-sm focus:border-[#2A9D8F] focus:outline-none focus:ring-1 focus:ring-[#2A9D8F] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-[#2D3748]">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={profile.city}
                      onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-[#2A9D8F]/20 bg-white/50 py-2.5 px-3 shadow-sm focus:border-[#2A9D8F] focus:outline-none focus:ring-1 focus:ring-[#2A9D8F] transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-[#2D3748]">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={profile.state}
                      onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-[#2A9D8F]/20 bg-white/50 py-2.5 px-3 shadow-sm focus:border-[#2A9D8F] focus:outline-none focus:ring-1 focus:ring-[#2A9D8F] transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-[#2D3748]">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zip"
                      value={profile.zip}
                      onChange={(e) => setProfile(prev => ({ ...prev, zip: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-[#2A9D8F]/20 bg-white/50 py-2.5 px-3 shadow-sm focus:border-[#2A9D8F] focus:outline-none focus:ring-1 focus:ring-[#2A9D8F] transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#2A9D8F] hover:bg-[#40B4A6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A9D8F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
} 