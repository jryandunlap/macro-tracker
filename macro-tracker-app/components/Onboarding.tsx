'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateMacros } from '@/lib/nutrition';
import { UserProfile } from '@/types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    sex: 'male' as 'male' | 'female',
    activity_level: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme',
    goal: 'muscle-gain' as 'lose-weight' | 'maintain' | 'muscle-gain' | 'recomp',
  });

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleComplete = async () => {
    try {
      const profile = {
        age: parseInt(formData.age),
        weight: parseInt(formData.weight),
        height: parseInt(formData.height),
        sex: formData.sex,
        activity_level: formData.activity_level,
        goal: formData.goal,
      };

      // Insert user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single();

      if (profileError) throw profileError;

      // Calculate and insert daily goals
      const macros = calculateMacros(profile as any);
      const { error: goalsError } = await supabase
        .from('daily_goals')
        .insert([
          {
            user_id: profileData.id,
            ...macros,
          },
        ]);

      if (goalsError) throw goalsError;

      onComplete(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
      <div className="p-6 min-h-screen flex flex-col">
        {/* Progress */}
        <div className="mb-8">
          <div className="text-sm text-gray-500 mb-2">Step {step} of 3</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1">
          {step === 1 && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Let's get to know you
              </h1>
              <p className="text-gray-600 mb-8">
                We'll use this to calculate your personalized nutrition goals.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="32"
                    value={formData.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sex
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateField('sex', 'male')}
                      className={`px-4 py-3 border-2 rounded-lg font-medium ${
                        formData.sex === 'male'
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => updateField('sex', 'female')}
                      className={`px-4 py-3 border-2 rounded-lg font-medium ${
                        formData.sex === 'female'
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (inches)
                  </label>
                  <input
                    type="number"
                    placeholder="72"
                    value={formData.height}
                    onChange={(e) => updateField('height', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    placeholder="180"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Activity Level
              </h1>
              <p className="text-gray-600 mb-8">
                How active are you on a typical day?
              </p>

              <div className="space-y-3">
                {[
                  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                  { value: 'light', label: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
                  { value: 'moderate', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
                  { value: 'very', label: 'Very Active', desc: 'Exercise 6-7 days/week' },
                  { value: 'extreme', label: 'Extremely Active', desc: 'Athlete / physical job' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateField('activity_level', option.value)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                      formData.activity_level === option.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Goal</h1>
              <p className="text-gray-600 mb-8">What are you working towards?</p>

              <div className="space-y-3">
                {[
                  { value: 'lose-weight', label: 'Lose Weight', desc: 'Caloric deficit with adequate protein' },
                  { value: 'maintain', label: 'Maintain Weight', desc: 'Balanced nutrition at maintenance calories' },
                  { value: 'muscle-gain', label: 'Gain Muscle', desc: 'Caloric surplus with high protein' },
                  { value: 'recomp', label: 'Body Recomposition', desc: 'Build muscle while losing fat' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateField('goal', option.value)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                      formData.goal === option.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>

              {formData.age && formData.weight && formData.height && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    Your Recommended Targets
                  </div>
                  {(() => {
                    const macros = calculateMacros({
                      age: parseInt(formData.age),
                      weight: parseInt(formData.weight),
                      height: parseInt(formData.height),
                      sex: formData.sex,
                      activity_level: formData.activity_level,
                      goal: formData.goal,
                    } as any);
                    return (
                      <div className="space-y-1 text-sm text-blue-800">
                        <div className="flex justify-between">
                          <span>Calories</span>
                          <span className="font-semibold">{macros.calories} / day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Protein</span>
                          <span className="font-semibold">{macros.protein}g / day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carbs</span>
                          <span className="font-semibold">{macros.carbs}g / day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fat</span>
                          <span className="font-semibold">{macros.fat}g / day</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => {
            if (step < 3) {
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
        >
          {step === 3 ? 'Get Started' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
