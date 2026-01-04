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
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are a nutrition expert. The user has logged their food: "${foodDescription}"

Analyze this and identify ALL distinct meals/snacks mentioned. The user might describe:
- A single meal (e.g., "grilled chicken and rice")
- Multiple meals (e.g., "For breakfast I had eggs. For lunch I had a sandwich.")
- An entire day of eating

Return ONLY a JSON object (no markdown, no explanation) with:

{
  "meals": [
    {
      "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
      "items": [
        {
          "canonical_name": "Normalized food name",
          "original_description": "Original text from user",
          "estimated_calories": number,
          "estimated_protein": number,
          "estimated_carbs": number,
          "estimated_fat": number
        }
      ]
    }
  ]
}

Rules:
1. Identify meal type from context clues:
   - Explicit: "for breakfast", "lunch was", "had for dinner"
   - Time-based: "this morning" = breakfast, "afternoon" = lunch/snack
   - Food type: eggs/cereal = breakfast, sandwich = lunch, steak = dinner
   - Default: Use "snack" if unclear

2. Break down EACH meal into individual food items
3. Make reasonable portion assumptions
4. Each item gets its own nutrition values

Examples:

Input: "For breakfast I had 2 eggs and bacon. Lunch was a chicken sandwich."
Output:
{
  "meals": [
    {
      "meal_type": "breakfast",
      "items": [
        {"canonical_name": "Eggs", "original_description": "2 eggs", "estimated_calories": 140, ...},
        {"canonical_name": "Bacon", "original_description": "bacon", "estimated_calories": 86, ...}
      ]
    },
    {
      "meal_type": "lunch",
      "items": [
        {"canonical_name": "Chicken Sandwich", "original_description": "chicken sandwich", "estimated_calories": 450, ...}
      ]
    }
  ]
}

Input: "Had pizza"
Output:
{
  "meals": [
    {
      "meal_type": "snack",
      "items": [
        {"canonical_name": "Pizza", "original_description": "pizza", "estimated_calories": 285, ...}
      ]
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
