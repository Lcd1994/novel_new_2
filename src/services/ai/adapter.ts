import type { AIConfig, AIGenerateMode, Character, WorldSetting, Chapter } from '@/types';

interface WriteContext {
  projectTitle: string;
  worldSetting: WorldSetting;
  characters: Character[];
  currentChapter: Chapter;
  previousChapter?: Chapter;
  mode: AIGenerateMode;
  customPrompt?: string;
}

interface GenOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface AIServiceAdapter {
  name: string;
  generate(prompt: string, options?: GenOptions): Promise<string>;
  continueWrite(context: WriteContext): Promise<string>;
}

export async function createAIService(config: AIConfig): Promise<AIServiceAdapter> {
  if (config.provider === 'deepseek') {
    return createDeepSeekService(config);
  } else if (config.provider === 'gemini') {
    return createGeminiService(config);
  }
  throw new Error(`Unsupported AI provider: ${config.provider}`);
}

async function createDeepSeekService(config: AIConfig): Promise<AIServiceAdapter> {
  const baseURL = config.baseUrl || 'https://api.deepseek.com';

  async function generate(prompt: string, options?: GenOptions): Promise<string> {
    if (!config.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async function continueWrite(context: WriteContext): Promise<string> {
    const { mode, projectTitle, worldSetting, characters, currentChapter, previousChapter } = context;

    let systemPrompt = `你是小说《${projectTitle}》的AI创作引擎。`;
    systemPrompt += `\n\n【世界观】\n时代:${worldSetting.era}\n地点:${worldSetting.location}\n社会规则:${worldSetting.societyRules}`;

    if (worldSetting.customRules.length > 0) {
      systemPrompt += `\n自定义规则:${worldSetting.customRules.join(',')}`;
    }

    const charIntro = characters.map(c =>
      `${c.name}(${c.role}): ${c.personality.map(p => p.tag).join(',') || '性格待定'}`
    ).join('\n');
    systemPrompt += `\n\n【角色】\n${charIntro}`;

    let userPrompt = '';

    switch (mode) {
      case 'continue':
        userPrompt = `续写当前章节"${currentChapter.title}"的下一段内容，保持文风连贯:\n\n${currentChapter.content}`;
        break;
      case 'advance':
        userPrompt = `根据当前章节结尾，推进剧情到下一章:\n\n${currentChapter.content}`;
        break;
      case 'polish':
        userPrompt = `润色以下小说内容，提升文笔:\n\n${currentChapter.content}`;
        break;
      case 'atmosphere':
        userPrompt = `生成一段氛围描写，渲染场景气氛:\n\n${currentChapter.content}`;
        break;
    }

    if (context.customPrompt) {
      userPrompt += `\n\n【额外要求】${context.customPrompt}`;
    }

    return generate(systemPrompt + '\n\n' + userPrompt);
  }

  return {
    name: 'DeepSeek',
    generate,
    continueWrite,
  };
}

async function createGeminiService(config: AIConfig): Promise<AIServiceAdapter> {
  async function generate(prompt: string, options?: GenOptions): Promise<string> {
    if (!config.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens ?? 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  return {
    name: 'Gemini',
    generate,
    continueWrite: async () => { throw new Error('Gemini continueWrite not implemented'); },
  };
}
