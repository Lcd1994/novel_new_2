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
  if (config.provider === 'gemini') {
    return createGeminiService(config);
  }
  if (config.provider === 'xiaomi-token') {
    return createXiaomiTokenService(config);
  }
  return createOpenAICompatibleService(config);
}

async function createOpenAICompatibleService(config: AIConfig): Promise<AIServiceAdapter> {
  const baseURL = config.baseUrl || 'https://api.deepseek.com';
  const model = config.model || 'deepseek-chat';

  async function generate(prompt: string, options?: GenOptions): Promise<string> {
    if (!config.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async function continueWrite(context: WriteContext): Promise<string> {
    const { mode, projectTitle, worldSetting, characters, currentChapter } = context;

    let systemPrompt = `你是小说《${projectTitle}》的AI创作引擎。`;
    systemPrompt += `\n\n【世界观】\n时代:${worldSetting.era}\n地点:${worldSetting.location}\n社会规则:${worldSetting.societyRules}`;

    if (worldSetting.customRules.length > 0) {
      systemPrompt += `\n自定义规则:${worldSetting.customRules.join(',')}`;
    }

    const charIntro = characters.map(c =>
      `${c.name}(${c.role === 'protagonist' ? '主角' : c.role === 'supporting' ? '配角' : '龙套'}): ${c.personality.map(p => p.tag).join(',') || '性格待定'}`
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
    name: config.provider === 'xiaomi-mimo' ? '小米MIMO' : (config.provider || 'Custom'),
    generate,
    continueWrite,
  };
}

async function createXiaomiTokenService(config: AIConfig): Promise<AIServiceAdapter> {
  const baseURL = config.baseUrl || 'https://api.mimo.mi.com/v1';
  const model = config.model || 'mimo-8b-chat';
  let accessToken: string | null = null;
  let tokenExpireTime = 0;

  async function getAccessToken(): Promise<string> {
    if (accessToken && Date.now() < tokenExpireTime) {
      return accessToken;
    }

    const response = await fetch(`${baseURL}/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: config.apiKey,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`获取Token失败: ${response.status} - ${error}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpireTime = Date.now() + (data.expires_in || 3600) * 1000 - 60000;

    return accessToken;
  }

  async function generate(prompt: string, options?: GenOptions): Promise<string> {
    if (!config.apiKey) {
      throw new Error('API key not configured');
    }

    const token = await getAccessToken();

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      accessToken = null;
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async function continueWrite(context: WriteContext): Promise<string> {
    const { mode, projectTitle, worldSetting, characters, currentChapter } = context;

    let systemPrompt = `你是小说《${projectTitle}》的AI创作引擎。`;
    systemPrompt += `\n\n【世界观】\n时代:${worldSetting.era}\n地点:${worldSetting.location}\n社会规则:${worldSetting.societyRules}`;

    if (worldSetting.customRules.length > 0) {
      systemPrompt += `\n自定义规则:${worldSetting.customRules.join(',')}`;
    }

    const charIntro = characters.map(c =>
      `${c.name}(${c.role === 'protagonist' ? '主角' : c.role === 'supporting' ? '配角' : '龙套'}): ${c.personality.map(p => p.tag).join(',') || '性格待定'}`
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
    name: '小米Token Plan',
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

  async function continueWrite(context: WriteContext): Promise<string> {
    const { mode, projectTitle, worldSetting, characters, currentChapter } = context;

    let prompt = `你是小说《${projectTitle}》的AI创作引擎。\n\n`;
    prompt += `【世界观】\n时代:${worldSetting.era}\n地点:${worldSetting.location}\n社会规则:${worldSetting.societyRules}\n\n`;

    if (worldSetting.customRules.length > 0) {
      prompt += `自定义规则:${worldSetting.customRules.join(',')}\n\n`;
    }

    const charIntro = characters.map(c =>
      `${c.name}(${c.role === 'protagonist' ? '主角' : c.role === 'supporting' ? '配角' : '龙套'}): ${c.personality.map(p => p.tag).join(',') || '性格待定'}`
    ).join('\n');
    prompt += `【角色】\n${charIntro}\n\n`;

    let taskPrompt = '';
    switch (mode) {
      case 'continue':
        taskPrompt = `续写当前章节"${currentChapter.title}"的下一段内容，保持文风连贯:\n\n${currentChapter.content}`;
        break;
      case 'advance':
        taskPrompt = `根据当前章节结尾，推进剧情到下一章:\n\n${currentChapter.content}`;
        break;
      case 'polish':
        taskPrompt = `润色以下小说内容，提升文笔:\n\n${currentChapter.content}`;
        break;
      case 'atmosphere':
        taskPrompt = `生成一段氛围描写，渲染场景气氛:\n\n${currentChapter.content}`;
        break;
    }

    if (context.customPrompt) {
      taskPrompt += `\n\n【额外要求】${context.customPrompt}`;
    }

    return generate(prompt + taskPrompt);
  }

  return {
    name: 'Gemini',
    generate,
    continueWrite,
  };
}
