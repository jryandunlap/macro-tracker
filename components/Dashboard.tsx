'use client';

import { useState, useEffect } from 'react';
import { UserProfile, DailyGoals, FoodEntry } from '@/types';
import { supabase } from '@/lib/supabase';
import DashboardHome from './DashboardHome';
import LogFood from './LogFood';
import Stats from './Stats';

interface DashboardProps {
  userProfile: UserProfile;
}

export default function Dashboard({ userProfile }: DashboardProps) {
  const [currentView, setCurrentView] = useState<'home' | 'log' | 'stats'>('home');
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null);
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userProfile]);

  async function loadData() {
    try {
      console.log('Loading data for user:', userProfile.id);
      
      // Load daily goals
      const { data: goals, error: goalsError } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();

      console.log('Daily goals:', goals, 'Error:', goalsError);
      setDailyGoals(goals);

      // Load today's entries - use local date, not UTC
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log('Querying for date:', localDate);
      
      const { data: entries, error: entriesError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', localDate)
        .order('created_at', { ascending: false });

      console.log('Food entries:', entries, 'Error:', entriesError);
      setTodayEntries(entries || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const refreshEntries = () => {
    loadData();
  };

  if (loading || !dailyGoals) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
      {currentView === 'home' && (
        <DashboardHome
          todayEntries={todayEntries}
          dailyGoals={dailyGoals}
          onRefresh={refreshEntries}
        />
      )}
      {currentView === 'log' && (
        <LogFood userProfile={userProfile} onComplete={refreshEntries} />
      )}
      {currentView === 'stats' && (
        <Stats userProfile={userProfile} dailyGoals={dailyGoals} />
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-1 p-2">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center py-2 ${
              currentView === 'home' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill={currentView === 'home' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setCurrentView('log')}
            className={`flex flex-col items-center py-2 ${
              currentView === 'log' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill={currentView === 'log' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span className="text-xs font-medium">Log Food</span>
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            className={`flex flex-col items-center py-2 ${
              currentView === 'stats' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill={currentView === 'stats' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span className="text-xs font-medium">Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
}
