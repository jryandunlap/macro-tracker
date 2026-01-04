'use client';

import { useState, useEffect } from 'react';
import { UserProfile, DailyGoals, FoodEntry } from '@/types';
import { supabase } from '@/lib/supabase';

interface StatsProps {
  userProfile: UserProfile;
  dailyGoals: DailyGoals;
}

export default function Stats({ userProfile, dailyGoals }: StatsProps) {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('7');
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [period]);

  async function loadEntries() {
    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      const { data } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userProfile.id)
        .gte('date', daysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }

  const calculateAverages = () => {
    if (entries.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, days: 0 };
    }

    // Group by date
    const byDate = entries.reduce((acc: any, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      acc[entry.date].calories += entry.calories;
      acc[entry.date].protein += entry.protein;
      acc[entry.date].carbs += entry.carbs;
      acc[entry.date].fat += entry.fat;
      return acc;
    }, {});

    const days = Object.keys(byDate).length;
    const totals = Object.values(byDate).reduce(
      (acc: any, day: any) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: Math.round(totals.calories / days),
      protein: Math.round(totals.protein / days),
      carbs: Math.round(totals.carbs / days),
      fat: Math.round(totals.fat / days),
      days,
    };
  };

  const calculateStreak = () => {
    if (entries.length === 0) return 0;

    const uniqueDates = [...new Set(entries.map((e) => e.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);

    for (const date of uniqueDates) {
      const entryDate = new Date(date);
      const diffDays = Math.floor(
        (checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
        checkDate = entryDate;
      } else {
        break;
      }
    }

    return streak;
  };

  const getLast7DaysProtein = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(dateStr);
    }

    return last7Days.map((date) => {
      const dayEntries = entries.filter((e) => e.date === date);
      const protein = dayEntries.reduce((sum, e) => sum + e.protein, 0);
      return { date, protein };
    });
  };

  const averages = calculateAverages();
  const streak = calculateStreak();
  const proteinData = getLast7DaysProtein();
  const maxProtein = Math.max(...proteinData.map((d) => d.protein), dailyGoals.protein);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
      </div>

      <div className="p-6">
        {/* Time Period Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPeriod('7')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              period === '7'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod('30')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              period === '30'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setPeriod('90')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              period === '90'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            90 Days
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Averages */}
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {period}-Day Averages
                {averages.days > 0 && (
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    ({averages.days} days logged)
                  </span>
                )}
              </h3>
              {averages.days === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No data for this period
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Calories</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {averages.calories} / {dailyGoals.calories}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (averages.calories / dailyGoals.calories) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Protein</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {averages.protein}g / {dailyGoals.protein}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (averages.protein / dailyGoals.protein) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Carbs</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {averages.carbs}g / {dailyGoals.carbs}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (averages.carbs / dailyGoals.carbs) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Fat</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {averages.fat}g / {dailyGoals.fat}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (averages.fat / dailyGoals.fat) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Streak */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90 mb-1">Current Streak</div>
                  <div className="text-4xl font-bold">{streak} days</div>
                  {streak > 0 && (
                    <div className="text-sm opacity-90 mt-1">Keep it going! 🔥</div>
                  )}
                </div>
                <div className="text-6xl">🎯</div>
              </div>
            </div>

            {/* Last 7 Days Protein Chart */}
            {period === '7' && proteinData.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Daily Protein Intake
                </h3>
                <div className="flex items-end justify-between h-48 gap-2">
                  {proteinData.map((day, idx) => {
                    const height = maxProtein > 0 ? (day.protein / maxProtein) * 100 : 0;
                    const isToday = idx === proteinData.length - 1;
                    const date = new Date(day.date);
                    const dayLabel = date.toLocaleDateString('en-US', {
                      weekday: 'short',
                    });

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center">
                        <div className="w-full relative" style={{ height: '100%' }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t transition-all ${
                              isToday
                                ? 'bg-green-500'
                                : day.protein > 0
                                ? 'bg-green-200'
                                : 'bg-gray-200'
                            }`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                          >
                            {day.protein > 0 && (
                              <div className="text-xs text-center mt-2 font-medium text-gray-700">
                                {day.protein}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className={`text-xs text-center mt-2 font-medium ${
                            isToday ? 'text-green-600' : 'text-gray-700'
                          }`}
                        >
                          {dayLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-600">
                    Goal: {dailyGoals.protein}g per day
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
