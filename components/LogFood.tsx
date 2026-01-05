'use client';
import { getLocalDateString, getDaysAgo } from '@/lib/dateUtils';

import { useState, useEffect } from 'react';
import { UserProfile, QuickAdd } from '@/types';
import { supabase } from '@/lib/supabase';

interface LogFoodProps {
  userProfile: UserProfile;
  onComplete: () => void;
}

export default function LogFood({ userProfile, onComplete }: LogFoodProps) {
  const [foodInput, setFoodInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickAdds, setQuickAdds] = useState<QuickAdd[]>([]);

  useEffect(() => {
    loadQuickAdds();
  }, []);

  async function loadQuickAdds() {
    try {
      // Get most frequent foods from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: entries } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userProfile.id)
        .gte('date', getDaysAgo(30));

      if (entries && entries.length > 0) {
        // Group by canonical_name and calculate averages
        const grouped = entries.reduce((acc: any, entry) => {
          const key = entry.canonical_name;
          if (!acc[key]) {
            acc[key] = {
              canonical_name: key,
              display_name: entry.food_description,
              frequency: 0,
              total_calories: 0,
              total_protein: 0,
              total_carbs: 0,
              total_fat: 0,
            };
          }
          acc[key].frequency++;
          acc[key].total_calories += entry.calories;
          acc[key].total_protein += entry.protein;
          acc[key].total_carbs += entry.carbs;
          acc[key].total_fat += entry.fat;
          return acc;
        }, {});

        // Calculate averages and sort by frequency
        const quickAddsList: QuickAdd[] = Object.values(grouped)
          .map((item: any) => ({
            canonical_name: item.canonical_name,
            display_name: item.display_name,
            frequency: item.frequency,
            avg_calories: Math.round(item.total_calories / item.frequency),
            avg_protein: Math.round(item.total_protein / item.frequency),
            avg_carbs: Math.round(item.total_carbs / item.frequency),
            avg_fat: Math.round(item.total_fat / item.frequency),
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 4);

        setQuickAdds(quickAddsList);
      }
    } catch (error) {
      console.error('Error loading quick adds:', error);
    }
  }

  async function handleLogFood() {
    if (!foodInput.trim()) return;

    setLoading(true);
    try {
      // Call Claude API to parse food
      const response = await fetch('/api/parse-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodDescription: foodInput }),
      });

      if (!response.ok) throw new Error('Failed to parse food');

      const parsedData = await response.json();
      const now = new Date();
      const currentDate = getLocalDateString(now);
      const currentTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      // Process each meal
      const allEntries: any[] = [];

      parsedData.meals.forEach((meal: any) => {
        const mealId = crypto.randomUUID();

        // Calculate meal totals
        const mealTotals = meal.items.reduce(
          (acc: any, item: any) => ({
            calories: acc.calories + item.estimated_calories,
            protein: acc.protein + item.estimated_protein,
            carbs: acc.carbs + item.estimated_carbs,
            fat: acc.fat + item.estimated_fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        // Create meal summary description from items
        const mealDescription = meal.items
          .map((item: any) => item.original_description)
          .join(', ');

        // Create meal summary entry
        const mealSummary = {
          user_id: userProfile.id,
          date: currentDate,
          time: currentTime,
          food_description: mealDescription,
          canonical_name: `${meal.meal_type} meal`,
          calories: mealTotals.calories,
          protein: mealTotals.protein,
          carbs: mealTotals.carbs,
          fat: mealTotals.fat,
          meal_id: mealId,
          meal_type: meal.meal_type,
          is_meal_summary: true,
        };

        // Create individual item entries
        const itemEntries = meal.items.map((item: any) => ({
          user_id: userProfile.id,
          date: currentDate,
          time: currentTime,
          food_description: item.original_description,
          canonical_name: item.canonical_name,
          calories: item.estimated_calories,
          protein: item.estimated_protein,
          carbs: item.estimated_carbs,
          fat: item.estimated_fat,
          meal_id: mealId,
          meal_type: meal.meal_type,
          is_meal_summary: false,
        }));

        allEntries.push(mealSummary, ...itemEntries);
      });

      // Insert all entries at once
      await supabase.from('food_entries').insert(allEntries);

      setFoodInput('');
      onComplete();
    } catch (error) {
      console.error('Error logging food:', error);
      alert('Failed to log food. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAdd(quickAdd: QuickAdd) {
    setLoading(true);
    try {
      const now = new Date();
      await supabase.from('food_entries').insert([
        {
          user_id: userProfile.id,
          date: getLocalDateString(now),
          time: now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          }),
          food_description: quickAdd.display_name,
          canonical_name: quickAdd.canonical_name,
          calories: quickAdd.avg_calories,
          protein: quickAdd.avg_protein,
          carbs: quickAdd.avg_carbs,
          fat: quickAdd.avg_fat,
        },
      ]);

      onComplete();
    } catch (error) {
      console.error('Error with quick add:', error);
      alert('Failed to log food. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Log Food</h1>
      </div>

      <div className="p-6">
        {/* Text Input Section */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">What did you eat?</h3>
          <textarea
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            placeholder="E.g., grilled salmon with asparagus and quinoa"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={loading}
          />
          <button
            onClick={handleLogFood}
            disabled={loading || !foodInput.trim()}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze & Log'
            )}
          </button>
        </div>

        {/* Voice Input Placeholder */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Voice Logging</h2>
            <p className="text-sm opacity-90 mb-3">Coming soon! Voice input will make logging even easier.</p>
          </div>
        </div>

        {/* Quick Add Section */}
        {quickAdds.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Your frequent items
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickAdds.map((item) => (
                <button
                  key={item.canonical_name}
                  onClick={() => handleQuickAdd(item)}
                  disabled={loading}
                  className="p-4 bg-white rounded-lg shadow text-left hover:shadow-md transition-shadow disabled:opacity-50"
                >
                  <div className="font-medium text-gray-900 text-sm mb-1">
                    {item.canonical_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ~{item.avg_protein}g protein
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Logged {item.frequency}x
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
