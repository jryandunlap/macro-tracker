import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { macroType, gap, currentProgress } = await request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `You are a nutrition expert. The user needs to close a gap in their daily nutrition.

Current situation:
- Target macro: ${macroType}
- Gap to close: ${gap}${macroType === 'calories' ? '' : 'g'}
- Current progress: ${currentProgress.calories} calories, ${currentProgress.protein}g protein, ${currentProgress.carbs}g carbs, ${currentProgress.fat}g fat

Suggest 3 simple snacks or small meals they might have at home that would help close this gap. Focus on realistic, common foods.

Return ONLY a JSON object (no markdown, no explanation) with:

{
  "suggestions": [
    {
      "name": "Food name",
      "description": "Specific quantity and ingredients (e.g., '1 scoop whey protein with 8oz milk' or '1 cup Greek yogurt with 10 almonds')",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "gap_closure": percentage (0-100, how much of the gap this closes)
    }
  ]
}

Guidelines:
- Prioritize the target macro (${macroType}) but keep other macros reasonable
- Suggest realistic portions and common household foods
- Order by best gap closure for the target macro
- For protein gaps: suggest protein-rich options (Greek yogurt, protein shake, turkey, tuna, eggs, cheese)
- For carb gaps: suggest carb-rich options (fruit, crackers, granola, oatmeal, toast)
- For calorie gaps: suggest calorie-dense options (nuts, nut butter, cheese, protein bars)
- For fat gaps: suggest healthy fat options (nuts, avocado, cheese, nut butter)

Example for protein gap of 30g:
{
  "suggestions": [
    {
      "name": "Protein Shake",
      "description": "1 scoop whey protein powder with 8oz milk",
      "calories": 220,
      "protein": 30,
      "carbs": 15,
      "fat": 3,
      "gap_closure": 100
    },
    {
      "name": "Greek Yogurt & Almonds",
      "description": "1 cup plain Greek yogurt with 10 almonds",
      "calories": 200,
      "protein": 22,
      "carbs": 12,
      "fat": 8,
      "gap_closure": 73
    },
    {
      "name": "Tuna on Crackers",
      "description": "1 can tuna (5oz) with 6 whole wheat crackers",
      "calories": 240,
      "protein": 28,
      "carbs": 18,
      "fat": 5,
      "gap_closure": 93
    }
  ]
}

Return ONLY the JSON object, nothing else.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0];
    
    if (content.type === 'text') {
      const suggestionsData = JSON.parse(content.text);
      return NextResponse.json(suggestionsData);
    }

    return NextResponse.json(
      { error: 'Unexpected response format' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error getting gap suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
