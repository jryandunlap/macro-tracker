import { UserProfile } from '@/types';

// Calculate TDEE using Mifflin-St Jeor Equation
export function calculateTDEE(profile: UserProfile): number {
  const { age, weight, height, sex, activity_level } = profile;
  
  // Convert to metric
  const weightKg = weight * 0.453592;
  const heightCm = height * 2.54;
  
  // Calculate BMR
  let bmr: number;
  if (sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  
  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extreme: 1.9,
  };
  
  return Math.round(bmr * activityMultipliers[activity_level]);
}

// Calculate macro goals based on goal type
export function calculateMacros(profile: UserProfile) {
  const tdee = calculateTDEE(profile);
  const { weight, goal } = profile;
  
  let calories: number;
  let proteinMultiplier: number;
  
  switch (goal) {
    case 'lose-weight':
      calories = Math.round(tdee * 0.85); // 15% deficit
      proteinMultiplier = 1.0; // 1g per lb
      break;
    case 'maintain':
      calories = tdee;
      proteinMultiplier = 0.8; // 0.8g per lb
      break;
    case 'muscle-gain':
      calories = Math.round(tdee * 1.15); // 15% surplus
      proteinMultiplier = 1.0; // 1g per lb
      break;
    case 'recomp':
      calories = tdee;
      proteinMultiplier = 1.0; // 1g per lb
      break;
    default:
      calories = tdee;
      proteinMultiplier = 0.8;
  }
  
  const protein = Math.round(weight * proteinMultiplier);
  const proteinCals = protein * 4;
  const fatCals = Math.round(calories * 0.25); // 25% from fat
  const fat = Math.round(fatCals / 9);
  const remainingCals = calories - proteinCals - fatCals;
  const carbs = Math.round(remainingCals / 4);
  
  return {
    calories,
    protein,
    carbs,
    fat,
  };
}
