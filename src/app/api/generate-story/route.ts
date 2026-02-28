import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

const THEME_DESCRIPTIONS: Record<string, string> = {
  enchanted_forest: 'a magical forest with talking animals, ancient trees, glowing mushrooms, and hidden fairy villages',
  underwater_kingdom: 'a beautiful underwater kingdom with mermaids, colorful fish, coral castles, and sea treasure',
  space_adventure: 'an exciting space adventure with spaceships, alien planets, friendly robots, and distant galaxies',
  dragon_realm: 'a realm of majestic dragons, knights, fire mountains, and hidden dragon eggs',
  magical_school: 'a school for young wizards where students learn spells, brew potions, and explore magical libraries',
  fairy_garden: 'a secret fairy garden full of tiny magical creatures, sparkling flowers, and enchanted ponds',
};

const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
  beginner: 'Write a short story (3-4 paragraphs). Use simple sentences and easy vocabulary. Use each target word once or twice.',
  intermediate: 'Write a medium-length story (5-6 paragraphs). Use clear but engaging language. Use each target word 2-3 times in natural contexts.',
  advanced: 'Write a longer, richer story (7-8 paragraphs). Use descriptive language, vivid imagery, and varied sentence structures. Use each target word multiple times in diverse contexts.',
};

export async function POST(req: NextRequest) {
  try {
    const { words, theme, difficulty, heroName } = await req.json();

    if (!words || !Array.isArray(words) || words.length < 2) {
      return NextResponse.json({ error: 'At least 2 words required' }, { status: 400 });
    }

    const themeDesc = THEME_DESCRIPTIONS[theme] || THEME_DESCRIPTIONS.enchanted_forest;
    const difficultyInstr = DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.intermediate;
    const safeHeroName = (heroName || 'Alex').slice(0, 20).replace(/[^a-zA-Z0-9 ]/g, '');

    const prompt = `You are a magical storyteller creating fairy tales for 10-year-old children.

Create an engaging fairy tale story set in ${themeDesc}. The main hero is named ${safeHeroName}.

Target vocabulary words to include: ${words.join(', ')}

Instructions:
1. ${difficultyInstr}
2. Naturally weave ALL the target vocabulary words into the story.
3. When you use a target vocabulary word in the story, wrap it with double brackets like this: [[word]]
4. Make the story exciting, age-appropriate, and fun for children.
5. Give the story a catchy title.

After the story, provide a JSON vocabulary section with the definition and a child-friendly example sentence for each target word.

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "title": "Story Title Here",
  "story": "Full story text here with [[vocabulary]] words in double brackets...",
  "vocabulary": {
    "word1": {
      "definition": "A clear, simple definition suitable for a 10-year-old",
      "example": "A short example sentence using the word"
    },
    "word2": {
      "definition": "...",
      "example": "..."
    }
  }
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    let parsed;
    try {
      // Strip potential markdown code fences
      const cleaned = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: try to extract JSON from the text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse story response');
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json({
      title: parsed.title || 'A Magical Tale',
      story: parsed.story || '',
      vocabulary: parsed.vocabulary || {},
      words,
      theme,
    });
  } catch (err) {
    console.error('Story generation error:', err);
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 });
  }
}
