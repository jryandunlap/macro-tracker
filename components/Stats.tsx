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
      
      // Use local date, not UTC
      const localDate = `${daysAgo.getFullYear()}-${String(daysAgo.getMonth() + 1).padStart(2, '0')}-${String(daysAgo.getDate()).padStart(2, '0')}`;

      const { data } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userProfile.id)
        .gte('date', localDate)
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
      (acc: { calories: number; protein: number; carbs: number; fat: number }, day: any) => ({
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

    const uniqueDates = Array.from(new Set(entries.map((e) => e.date))).sort().reverse();
    let streak = 0;
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let checkDate = new Date(todayStr);

    for (const date of uniqueDates) {
      const entryDate = new Date(date + 'T00:00:00');
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

  // Get last 7 days of data for multi-line chart
  const getLast7DaysData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      last7Days.push(dateStr);
    }

    return last7Days.map((date) => {
      const dayEntries = entries.filter((e) => e.date === date);
      const totals = dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          carbs: acc.carbs + e.carbs,
          fat: acc.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      
      return { date, ...totals };
    });
  };

  const averages = calculateAverages();
  const streak = calculateStreak();
  const chartData = getLast7DaysData();
  
  // Calculate max values for scaling
  const maxCalories = Math.max(...chartData.map((d) => d.calories), dailyGoals.calories);
  const maxProtein = Math.max(...chartData.map((d) => d.protein), dailyGoals.protein);
  const maxCarbs = Math.max(...chartData.map((d) => d.carbs), dailyGoals.carbs);
  const maxFat = Math.max(...chartData.map((d) => d.fat), dailyGoals.fat);

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
                <p className="text-center text-gray-500 py-4">
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

            {/* 7-Day Chart - Only show for 7-day period */}
            {period === '7' && chartData.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  7-Day Macro Trends
                </h3>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Calories (/{Math.round(dailyGoals.calories / 10)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Protein</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>Carbs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Fat</span>
                  </div>
                </div>

                {/* Simple line visualization */}
                <div className="space-y-3">
                  {chartData.map((day, idx) => {
                    const date = new Date(day.date + 'T00:00:00');
                    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const hasData = day.calories > 0;
                    
                    return (
                      <div key={day.date} className="flex items-center gap-2">
                        <div className="w-10 text-xs text-gray-600 font-medium">{dayLabel}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                          {hasData ? (
                            <>
                              <div 
                                className="absolute left-0 top-0 h-2 bg-blue-500 opacity-70"
                                style={{ width: `${Math.min(100, (day.calories / 10) / (dailyGoals.calories / 10) * 100)}%` }}
                              ></div>
                              <div 
                                className="absolute left-0 top-2 h-2 bg-green-500 opacity-70"
                                style={{ width: `${Math.min(100, day.protein / dailyGoals.protein * 100)}%` }}
                              ></div>
                              <div 
                                className="absolute left-0 top-4 h-2 bg-amber-500 opacity-70"
                                style={{ width: `${Math.min(100, day.carbs / dailyGoals.carbs * 100)}%` }}
                              ></div>
                              <div 
                                className="absolute left-0 top-6 h-2 bg-red-500 opacity-70"
                                style={{ width: `${Math.min(100, day.fat / dailyGoals.fat * 100)}%` }}
                              ></div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-gray-400">
                              No data
                            </div>
                          )}
                        </div>
                        {hasData && (
                          <div className="w-16 text-xs text-gray-600 text-right">
                            {day.protein}g P
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
