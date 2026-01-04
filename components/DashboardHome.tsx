'use client';

import { useState } from 'react';
import { DailyGoals, FoodEntry, DailyProgress, MealGroup } from '@/types';
import { supabase } from '@/lib/supabase';

interface DashboardHomeProps {
  todayEntries: FoodEntry[];
  dailyGoals: DailyGoals;
  onRefresh: () => void;
}

export default function DashboardHome({ todayEntries, dailyGoals, onRefresh }: DashboardHomeProps) {
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const [showBreakdownModal, setShowBreakdownModal] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showGapModal, setShowGapModal] = useState<string | null>(null);
  const [gapSuggestions, setGapSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleCloseGap = async (macroType: string, currentValue: number, goalValue: number) => {
    setShowGapModal(macroType);
    setLoadingSuggestions(true);

    try {
      const gap = goalValue - currentValue;
      const response = await fetch('/api/gap-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          macroType: macroType.toLowerCase(),
          gap,
          currentProgress: { calories: progress.calories.current, protein: progress.protein.current, carbs: progress.carbs.current, fat: progress.fat.current }
        }),
      });

      if (!response.ok) throw new Error('Failed to get suggestions');

      const data = await response.json();
      setGapSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setGapSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm('Delete this entire meal? This will remove all items.')) return;

    setDeletingId(mealId);
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('meal_id', mealId);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteItem = async (itemId: string, mealId: string) => {
    if (!confirm('Delete this item? The meal total will update.')) return;

    setDeletingId(itemId);
    try {
      // Delete the individual item
      const { error: deleteError } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      // Recalculate meal summary
      const { data: remainingItems } = await supabase
        .from('food_entries')
        .select('*')
        .eq('meal_id', mealId)
        .eq('is_meal_summary', false);

      if (remainingItems && remainingItems.length > 0) {
        // Update meal summary with new totals
        const newTotals = remainingItems.reduce(
          (acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fat: acc.fat + item.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        await supabase
          .from('food_entries')
          .update(newTotals)
          .eq('meal_id', mealId)
          .eq('is_meal_summary', true);
      } else {
        // No items left, delete the meal summary too
        await supabase
          .from('food_entries')
          .delete()
          .eq('meal_id', mealId)
          .eq('is_meal_summary', true);
      }

      onRefresh();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const calculateProgress = (): DailyProgress => {
    // Only count meal summaries to avoid double-counting
    const summaries = todayEntries.filter((e) => e.is_meal_summary);
    const totals = summaries.reduce(
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

  // Group entries by meal
  const groupMeals = (): MealGroup[] => {
    const mealMap = new Map<string, MealGroup>();

    todayEntries.forEach((entry) => {
      if (entry.is_meal_summary && entry.meal_id) {
        const items = todayEntries.filter(
          (e) => e.meal_id === entry.meal_id && !e.is_meal_summary
        );

        mealMap.set(entry.meal_id, {
          id: entry.meal_id,
          meal_type: entry.meal_type || 'snack',
          time: entry.time,
          items,
          totals: {
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
          },
        });
      }
    });

    return Array.from(mealMap.values());
  };

  const toggleMeal = (mealId: string) => {
    const newExpanded = new Set(expandedMeals);
    if (newExpanded.has(mealId)) {
      newExpanded.delete(mealId);
    } else {
      newExpanded.add(mealId);
    }
    setExpandedMeals(newExpanded);
  };

  const getMealEmoji = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🍳';
      case 'lunch':
        return '🍽️';
      case 'dinner':
        return '🍴';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const progress = calculateProgress();
  const meals = groupMeals();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const GapSuggestionsModal = () => {
    if (!showGapModal) return null;

    const macroKey = showGapModal.toLowerCase() as 'calories' | 'protein' | 'carbs' | 'fat';
    const currentProgress = progress[macroKey];
    const gap = currentProgress.goal - currentProgress.current;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowGapModal(null)}
      >
        <div
          className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Close Your {showGapModal} Gap
              </h2>
              <button
                onClick={() => setShowGapModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              You need ~{Math.round(gap)}{showGapModal === 'Calories' ? '' : 'g'} more {showGapModal.toLowerCase()} to hit your goal
            </div>
          </div>

          <div className="overflow-y-auto max-h-[60vh] p-6">
            {loadingSuggestions ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Getting suggestions...</p>
              </div>
            ) : gapSuggestions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No suggestions available</p>
            ) : (
              <div className="space-y-4">
                {gapSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{suggestion.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Option {idx + 1}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded">
                        <div className="text-gray-500">Calories</div>
                        <div className="font-semibold text-gray-900">{suggestion.calories}</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-gray-500">Protein</div>
                        <div className="font-semibold text-gray-900">{suggestion.protein}g</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-gray-500">Carbs</div>
                        <div className="font-semibold text-gray-900">{suggestion.carbs}g</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-gray-500">Fat</div>
                        <div className="font-semibold text-gray-900">{suggestion.fat}g</div>
                      </div>
                    </div>
                    {suggestion.gap_closure && (
                      <div className="mt-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded">
                        ✓ Closes {Math.round(suggestion.gap_closure)}% of your {showGapModal.toLowerCase()} gap
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MacroCircle = ({
    label,
    current,
    goal,
    percent,
    color,
    onClick,
  }: {
    label: string;
    current: number;
    goal: number;
    percent: number;
    color: string;
    onClick: () => void;
  }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percent / 100);

    // Show "close gap" button if it's after 6pm and not at goal
    const currentHour = new Date().getHours();
    const showCloseGap = currentHour >= 18 && percent < 90;
    const isOverLimit = percent > 115;
    const isOnTarget = percent >= 90 && percent <= 115;

    return (
      <div className="text-center">
        <div className="cursor-pointer" onClick={onClick}>
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
            {Math.round(current)} / {goal}
            {label === 'Calories' ? '' : 'g'}
          </div>
        </div>
        {showCloseGap && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCloseGap(label, current, goal);
            }}
            className="mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
          >
            Close gap! 🎯
          </button>
        )}
        {isOnTarget && (
          <div className="mt-2 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
            On target ✓
          </div>
        )}
        {isOverLimit && (
          <div className="mt-2 text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
            Over limit ⚠️
          </div>
        )}
      </div>
    );
  };

  const BreakdownModal = ({ macroType }: { macroType: string }) => {
    const items = todayEntries.filter((e) => !e.is_meal_summary);
    const sortedItems = [...items].sort((a, b) => {
      const key = macroType.toLowerCase() as 'calories' | 'protein' | 'carbs' | 'fat';
      return b[key] - a[key];
    });

    const total = progress[macroType.toLowerCase() as keyof DailyProgress];

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowBreakdownModal(null)}
      >
        <div
          className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {macroType} Breakdown
              </h2>
              <button
                onClick={() => setShowBreakdownModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {Math.round(total.current)} / {total.goal}
              {macroType === 'Calories' ? '' : 'g'} ({Math.round(total.percent)}%)
            </div>
          </div>

          <div className="overflow-y-auto max-h-[60vh] p-6">
            {sortedItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No items logged yet</p>
            ) : (
              <div className="space-y-3">
                {sortedItems.map((item) => {
                  const key = macroType.toLowerCase() as
                    | 'calories'
                    | 'protein'
                    | 'carbs'
                    | 'fat';
                  const value = item[key];
                  const percentage =
                    total.current > 0 ? (value / total.current) * 100 : 0;

                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {item.food_description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(percentage)}% of total
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-gray-900">
                          {value}
                          {macroType === 'Calories' ? '' : 'g'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
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
              onClick={() => setShowBreakdownModal('Calories')}
            />
            <MacroCircle
              label="Protein"
              current={progress.protein.current}
              goal={progress.protein.goal}
              percent={progress.protein.percent}
              color="#10b981"
              onClick={() => setShowBreakdownModal('Protein')}
            />
            <MacroCircle
              label="Carbs"
              current={progress.carbs.current}
              goal={progress.carbs.goal}
              percent={progress.carbs.percent}
              color="#f59e0b"
              onClick={() => setShowBreakdownModal('Carbs')}
            />
            <MacroCircle
              label="Fat"
              current={progress.fat.current}
              goal={progress.fat.goal}
              percent={progress.fat.percent}
              color="#ef4444"
              onClick={() => setShowBreakdownModal('Fat')}
            />
          </div>
        </div>
      </div>

      {/* Today's Log */}
      <div className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Today's Log</h2>
          <span className="text-sm text-gray-500">{meals.length} meals</span>
        </div>

        {meals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600 mb-1">No food logged yet today</p>
            <p className="text-sm text-gray-500">
              Tap "Log Food" below to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => {
              const isExpanded = expandedMeals.has(meal.id);

              return (
                <div key={meal.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Meal Summary */}
                  <div
                    className="p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => toggleMeal(meal.id)}
                      >
                        <span className="text-xl">{getMealEmoji(meal.meal_type)}</span>
                        <div>
                          <div className="font-semibold text-gray-900 capitalize">
                            {meal.meal_type}
                          </div>
                          <div className="text-sm text-gray-500">{meal.time}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {meal.totals.calories} cal
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMeal(meal.id);
                          }}
                          disabled={deletingId === meal.id}
                          className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                        <button 
                          onClick={() => toggleMeal(meal.id)}
                          className="cursor-pointer"
                        >
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div 
                      className="flex gap-4 text-xs text-gray-600 cursor-pointer"
                      onClick={() => toggleMeal(meal.id)}
                    >
                      <span>P: {meal.totals.protein}g</span>
                      <span>C: {meal.totals.carbs}g</span>
                      <span>F: {meal.totals.fat}g</span>
                    </div>
                  </div>

                  {/* Expanded Items */}
                  {isExpanded && meal.items.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
                      <div className="space-y-2">
                        {meal.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start py-2 text-sm group"
                          >
                            <div className="flex-1">
                              <div className="text-gray-700">
                                {item.food_description}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 ml-4">
                              <div className="text-right">
                                <div className="text-gray-900 font-medium">
                                  {item.calories} cal
                                </div>
                                <div className="text-xs text-gray-500">
                                  P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteItem(item.id, meal.id)}
                                disabled={deletingId === item.id}
                                className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Breakdown Modal */}
      {showBreakdownModal && <BreakdownModal macroType={showBreakdownModal} />}

      {/* Gap Suggestions Modal */}
      <GapSuggestionsModal />
    </div>
  );
}
