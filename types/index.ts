export interface UserProfile {
  id: string;
  age: number;
  weight: number;
  height: number;
  sex: 'male' | 'female';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';
  goal: 'lose-weight' | 'maintain' | 'muscle-gain' | 'recomp';
  created_at: string;
}

export interface DailyGoals {
  id: string;
  user_id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  date: string;
  time: string;
  food_description: string;
  canonical_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface QuickAdd {
  canonical_name: string;
  display_name: string;
  frequency: number;
  avg_calories: number;
  avg_protein: number;
  avg_carbs: number;
  avg_fat: number;
}

export interface DailyProgress {
  calories: { current: number; goal: number; percent: number };
  protein: { current: number; goal: number; percent: number };
  carbs: { current: number; goal: number; percent: number };
  fat: { current: number; goal: number; percent: number };
}
