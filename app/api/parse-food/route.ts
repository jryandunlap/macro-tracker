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
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are a nutrition expert. The user has logged the following food: "${foodDescription}"

Please analyze this and return ONLY a JSON object (no markdown, no explanation) with:
1. canonical_name: A normalized name for this food (e.g., "Grilled Chicken Breast" for "grilled chicken", "chicken breast grilled", etc.)
2. estimated_calories: Estimated calories
3. estimated_protein: Estimated protein in grams
4. estimated_carbs: Estimated carbs in grams
5. estimated_fat: Estimated fat in grams
6. portion_note: Brief note about assumed portion size

Make reasonable assumptions about portion sizes if not specified (e.g., 6oz chicken breast, 1 cup rice, etc.).

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
      const nutritionData = JSON.parse(content.text);
      return NextResponse.json(nutritionData);
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
