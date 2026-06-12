import type { Character, PersonalityTag } from '@/types';

export function evolveCharacter(
  character: Character,
  chapterId: string,
  event: string,
  aiAnalysis: string
): Partial<Character> {
  const personalityChanges: Partial<PersonalityTag>[] = [];

  const traitMapping: Record<string, string[]> = {
    '勇敢': ['勇敢', '坚定', '果断'],
    '懦弱': ['谨慎', '内敛', '保守'],
    '善良': ['温柔', '体贴', '包容'],
    '冷酷': ['理性', '冷静', '疏离'],
    '乐观': ['积极', '开朗', '自信'],
    '悲观': ['深思', '敏感', '警觉'],
  };

  const traits = Object.entries(traitMapping).find(([_, synonyms]) =>
    synonyms.some(t => aiAnalysis.includes(t))
  );

  if (traits) {
    const [baseTrait, ...relatedTraits] = traits;
    personalityChanges.push({
      tag: baseTrait,
      weight: Math.min(1, 0.7 + Math.random() * 0.3),
      evolvedAt: Date.now(),
    });
  }

  return {
    growthLog: [
      ...character.growthLog,
      {
        chapterId,
        description: event,
        personalityChanges,
        timestamp: Date.now(),
      },
    ],
  };
}

export function updateRelationships(
  characters: Character[],
  event: string,
  affectedCharIds: string[]
): Character[] {
  const updated = [...characters];

  for (const charId of affectedCharIds) {
    const charIndex = updated.findIndex(c => c.id === charId);
    if (charIndex === -1) continue;

    const char = updated[charIndex];
    let intimacyDelta = 0;

    if (event.includes('帮助') || event.includes('救')) {
      intimacyDelta = 15;
    } else if (event.includes('背叛') || event.includes('伤害')) {
      intimacyDelta = -20;
    } else if (event.includes('误解') || event.includes('争吵')) {
      intimacyDelta = -10;
    } else if (event.includes('合作') || event.includes('共同')) {
      intimacyDelta = 10;
    }

    updated[charIndex] = {
      ...char,
      relationships: char.relationships.map(rel => {
        if (affectedCharIds.includes(rel.targetId)) {
          return { ...rel, intimacy: Math.max(-100, Math.min(100, rel.intimacy + intimacyDelta)) };
        }
        return rel;
      }),
    };
  }

  return updated;
}
