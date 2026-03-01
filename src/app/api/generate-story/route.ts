import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { NextRequest, NextResponse } from 'next/server';

interface LlmConfig {
  url: string;
  model: string;
  bearer_token: string;
}

interface AppConfig {
  llm: LlmConfig;
}

function loadConfig(): LlmConfig {
  const configPath = path.join(process.cwd(), 'config.yaml');
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(raw) as AppConfig;
  if (!config?.llm?.bearer_token || config.llm.bearer_token === 'YOUR_BEARER_TOKEN_HERE') {
    throw new Error('Bearer token not configured in config.yaml');
  }
  return config.llm;
}

const THEME_DESCRIPTIONS: Record<string, string> = {
  enchanted_forest: 'a magical forest with talking animals, ancient trees, glowing mushrooms, and hidden fairy villages',
  underwater_kingdom: 'a beautiful underwater kingdom with mermaids, colorful fish, coral castles, and sea treasure',
  space_adventure: 'an exciting space adventure with spaceships, alien planets, friendly robots, and distant galaxies',
  dragon_realm: 'a realm of majestic dragons, knights, fire mountains, and hidden dragon eggs',
  magical_school: 'a school for young wizards where students learn spells, brew potions, and explore magical libraries',
  fairy_garden: 'a secret fairy garden full of tiny magical creatures, sparkling flowers, and enchanted ponds',
};

const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
  beginner: 'Use very simple, short sentences. Each target word should appear once.',
  intermediate: 'Use clear, engaging sentences. Each target word should appear 2-3 times in natural contexts.',
  advanced: 'Use descriptive language and varied sentence structures. Each target word should appear multiple times in diverse contexts.',
};

export async function POST(req: NextRequest) {
  try {
    const { words, theme, difficulty, heroName } = await req.json();

    if (!words || !Array.isArray(words) || words.length < 2) {
      return NextResponse.json({ error: 'At least 2 words required' }, { status: 400 });
    }

    const llm = loadConfig();

    const themeDesc = THEME_DESCRIPTIONS[theme] || THEME_DESCRIPTIONS.enchanted_forest;
    const difficultyInstr = DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.intermediate;
    const safeHeroName = (heroName || 'Alex').slice(0, 20).replace(/[^a-zA-Z0-9 ]/g, '');

    const prompt = `You are a magical storyteller creating fairy tales for 10-year-old children.

Create an engaging fairy tale story set in ${themeDesc}. The main hero is named ${safeHeroName}.

Target vocabulary words to include: ${words.join(', ')}

Instructions:
1. WORD LIMIT: The story must be 200 words or fewer. Count carefully.
2. VOCABULARY LEVEL: Only use words that are as simple as or simpler than the target vocabulary words above. Do not introduce harder or more complex words than necessary.
3. ${difficultyInstr}
4. Naturally weave ALL the target vocabulary words into the story.
5. When you use a target vocabulary word in the story, wrap it with double brackets like this: [[word]]
6. Make the story exciting, age-appropriate, and fun for children.
7. Give the story a catchy title.

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

    const response = await axios.post(
      llm.url,
      {
        model: llm.model,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${llm.bearer_token}`,
        },
      }
    );

    const rawText: string = response.data?.choices?.[0]?.message?.content ?? '';

    let parsed;
    try {
      const cleaned = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
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
    const message = err instanceof Error ? err.message : 'Failed to generate story';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
