'use client';

import { DailyGoals, FoodEntry, DailyProgress } from '@/types';

interface DashboardHomeProps {
  todayEntries: FoodEntry[];
  dailyGoals: DailyGoals;
  onRefresh: () => void;
}

export default function DashboardHome({ todayEntries, dailyGoals, onRefresh }: DashboardHomeProps) {
  const calculateProgress = (): DailyProgress => {
    const totals = todayEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: {
        current: totals.calories,
        goal: dailyGoals.calories,
        percent: Math.min(100, (totals.calories / dailyGoals.calories) * 100),
      },
      protein: {
        current: totals.protein,
        goal: dailyGoals.protein,
        percent: Math.min(100, (totals.protein / dailyGoals.protein) * 100),
      },
      carbs: {
        current: totals.carbs,
        goal: dailyGoals.carbs,
        percent: Math.min(100, (totals.carbs / dailyGoals.carbs) * 100),
      },
      fat: {
        current: totals.fat,
        goal: dailyGoals.fat,
        percent: Math.min(100, (totals.fat / dailyGoals.fat) * 100),
      },
    };
  };

  const progress = calculateProgress();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const MacroCircle = ({ 
    label, 
    current, 
    goal, 
    percent, 
    color 
  }: { 
    label: string; 
    current: number; 
    goal: number; 
    percent: number; 
    color: string;
  }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percent / 100);

    return (
      <div className="text-center">
        <div className="relative inline-block mb-2">
          <svg className="w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 48 48)"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {Math.round(percent)}%
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">
          {Math.round(current)} / {goal}{label === 'Calories' ? '' : 'g'}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button onClick={onRefresh} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="text-sm opacity-90">{currentDate}</div>
      </div>

      {/* Macro Circles */}
      <div className="px-6 -mt-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-2 gap-6">
            <MacroCircle
              label="Calories"
              current={progress.calories.current}
              goal={progress.calories.goal}
              percent={progress.calories.percent}
              color="#3b82f6"
            />
            <MacroCircle
              label="Protein"
              current={progress.protein.current}
              goal={progress.protein.goal}
              percent={progress.protein.percent}
              color="#10b981"
            />
            <MacroCircle
              label="Carbs"
              current={progress.carbs.current}
              goal={progress.carbs.goal}
              percent={progress.carbs.percent}
              color="#f59e0b"
            />
            <MacroCircle
              label="Fat"
              current={progress.fat.current}
              goal={progress.fat.goal}
              percent={progress.fat.percent}
              color="#ef4444"
            />
          </div>
        </div>
      </div>

      {/* Today's Log */}
      <div className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Today's Log</h2>
          <span className="text-sm text-gray-500">{todayEntries.length} entries</span>
        </div>

        {todayEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-1">No food logged yet today</p>
            <p className="text-sm text-gray-500">Tap "Log Food" below to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {entry.food_description}
                    </div>
                    <div className="text-sm text-gray-500">{entry.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {entry.calories} cal
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>P: {entry.protein}g</span>
                  <span>C: {entry.carbs}g</span>
                  <span>F: {entry.fat}g</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
