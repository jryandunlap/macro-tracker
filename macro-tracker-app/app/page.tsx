'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';
import { UserProfile } from '@/types';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkUserProfile();
  }, []);

  async function checkUserProfile() {
    try {
      // For V1, we're using a simple single-user setup
      // Just check if there's any profile in the database
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
        .single();

      if (data && !error) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Onboarding onComplete={setUserProfile} />;
  }

  return <Dashboard userProfile={userProfile} />;
}
