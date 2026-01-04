import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { foodDescription } = await request.json();

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
            content: `You are a nutrition expert. The user has logged: "${foodDescription}"

Analyze this and return ONLY a JSON object (no markdown, no explanation) with:

1. meal_type: Determine if this is "breakfast", "lunch", "dinner", or "snack" based on context/foods mentioned
2. items: An array of individual food items, each with:
   - canonical_name: Normalized name (e.g., "Grilled Chicken Breast")
   - original_description: The original text for this item from the user's input
   - estimated_calories: Calories for THIS item
   - estimated_protein: Protein in grams for THIS item
   - estimated_carbs: Carbs in grams for THIS item
   - estimated_fat: Fat in grams for THIS item

Important:
- Break down the meal into individual food items
- Make reasonable assumptions about portion sizes if not specified
- Each item should have its own nutrition values
- The sum of all items should equal the total meal nutrition

Example format:
{
  "meal_type": "breakfast",
  "items": [
    {
      "canonical_name": "Scrambled Eggs",
      "original_description": "2 scrambled eggs",
      "estimated_calories": 180,
      "estimated_protein": 12,
      "estimated_carbs": 2,
      "estimated_fat": 12
    },
    {
      "canonical_name": "Bacon",
      "original_description": "3 strips of bacon",
      "estimated_calories": 129,
      "estimated_protein": 9,
      "estimated_carbs": 0,
      "estimated_fat": 10
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
      // Parse the JSON response from Claude
      const mealData = JSON.parse(content.text);
      return NextResponse.json(mealData);
    }

    return NextResponse.json(
      { error: 'Unexpected response format' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error parsing food:', error);
    return NextResponse.json(
      { error: 'Failed to parse food description' },
      { status: 500 }
    );
  }
}
