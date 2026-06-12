import type { AIConfig, AIGenerateMode, Character, WorldSetting, Chapter, GenerationParams } from '@/types';

interface WriteContext {
  projectTitle: string;
  worldSetting: WorldSetting | null;
  characters: Character[];
  currentChapter: Chapter;
  previousChapters?: Chapter[];
  mode: AIGenerateMode;
  customPrompt?: string;
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface AIServiceAdapter {
  name: string;
  generate(prompt: string, options?: GenerationParams): Promise<string>;
  generateStream(prompt: string, callbacks: StreamCallbacks, options?: GenerationParams): Promise<void>;
  continueWrite(context: WriteContext, options?: GenerationParams): Promise<string>;
  continueWriteStream(context: WriteContext, callbacks: StreamCallbacks, options?: GenerationParams): Promise<void>;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeAPIRequest(
  url: string,
  headers: Record<string, string>,
  body: any,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        await sleep(2000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`API错误 (${response.status}): ${errorText.slice(0, 200)}`);
        if (response.status >= 500) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        throw lastError;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await sleep(1000 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('API请求失败');
}

async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  onToken: (token: string) => void
): Promise<string> {
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const data = trimmed.slice(5).trim();
      if (data === '[DONE]' || data === '') continue;

      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content || 
                     json.choices?.[0]?.message?.content || '';
        if (token) {
          fullText += token;
          onToken(token);
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return fullText;
}

function buildSystemPrompt(context: WriteContext): string {
  const { projectTitle, worldSetting, characters, mode } = context;

  let systemPrompt = `你是一位才华横溢的小说家，专注于创作引人入胜的中文小说。你的文字风格细腻、生动、富有画面感。

【当前作品】
书名：${projectTitle}

【写作要求】
1. 使用生动的描写，避免简单的叙述和对话堆砌
2. 保持角色性格和口吻的一致性
3. 注意节奏变化，在适当的时候加入紧张感或舒缓
4. 使用标准中文书写，避免网络用语和过度口语化
5. 每段长度适中，段落间留出呼吸空间
6. 善用比喻、拟人、通感等修辞增强画面感
7. 对话要自然，符合角色身份和情境
8. 避免机械的提示和元信息
9. 只输出正文内容，不要输出"好的"、"以下是..."等开场白
10. 不要输出章节标题或任何标记，只输出纯正文`;

  if (worldSetting && (worldSetting.era || worldSetting.location || worldSetting.societyRules || (worldSetting.customRules && worldSetting.customRules.length > 0))) {
    systemPrompt += `\n\n【世界观】`;
    if (worldSetting.era) systemPrompt += `\n时代背景：${worldSetting.era}`;
    if (worldSetting.location) systemPrompt += `\n地理环境：${worldSetting.location}`;
    if (worldSetting.societyRules) systemPrompt += `\n社会规则：${worldSetting.societyRules}`;
    if (worldSetting.customRules && worldSetting.customRules.length > 0) {
      systemPrompt += `\n特殊设定：${worldSetting.customRules.join('；')}`;
    }
  }

  if (characters.length > 0) {
    systemPrompt += `\n\n【主要角色】`;
    characters.forEach(char => {
      const roleLabel = char.role === 'protagonist' ? '主角' : char.role === 'supporting' ? '配角' : '龙套';
      const personality = char.personality.length > 0 
        ? char.personality.map(p => p.tag).join('、')
        : '待定';
      systemPrompt += `\n- ${char.name}（${roleLabel}）：性格特点：${personality}。当前状态：${char.currentState || '待登场'}`;
    });
  }

  const modeInstructions: Record<AIGenerateMode, string> = {
    continue: '请根据前面的内容自然续写，保持情节的连贯性和角色的一致性。',
    advance: '请推进剧情发展，引入新的事件或冲突，让故事向前发展。',
    polish: '请重写以下内容，优化文笔、增强表达，但保持原意和角色不变。',
    atmosphere: '请用充满画面感的文字描绘场景氛围，运用感官描写增强代入感。',
    dialogue: '请创作生动的对话场景，让角色通过对话展现性格和推动情节。',
    action: '请创作一段紧张刺激的动作或冲突场景，注意节奏和画面感。',
  };

  systemPrompt += `\n\n【当前模式】${modeInstructions[mode] || modeInstructions.continue}`;

  return systemPrompt;
}

function buildUserPrompt(context: WriteContext): string {
  const { mode, currentChapter, customPrompt } = context;

  let prompt = `【当前章节】${currentChapter.title || '新章节'}`;

  if (currentChapter.content && currentChapter.content.trim()) {
    const lastContent = currentChapter.content.slice(-500);
    prompt += `\n\n【最近内容（续接用）】\n${lastContent}`;
  } else {
    prompt += `\n\n【章节状态】这是本章的开头，请自然开始。`;
  }

  if (customPrompt && customPrompt.trim()) {
    prompt += `\n\n【作者补充说明】\n${customPrompt.trim()}`;
  }

  return prompt;
}

async function createOpenAICompatibleService(config: AIConfig): Promise<AIServiceAdapter> {
  const baseURL = config.baseUrl || 'https://api.deepseek.com';
  const model = config.model || 'deepseek-chat';

  async function generate(prompt: string, options?: GenerationParams): Promise<string> {
    if (!config.apiKey) throw new Error('请先配置API Key');

    const response = await makeAPIRequest(
      `${baseURL}/chat/completions`,
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.maxTokens ?? 2000,
        top_p: options?.topP ?? 0.95,
        stream: false,
      }
    );

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async function generateStream(
    prompt: string,
    callbacks: StreamCallbacks,
    options?: GenerationParams
  ): Promise<void> {
    if (!config.apiKey) {
      callbacks.onError(new Error('请先配置API Key'));
      return;
    }

    try {
      const response = await makeAPIRequest(
        `${baseURL}/chat/completions`,
        {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.8,
          max_tokens: options?.maxTokens ?? 2000,
          top_p: options?.topP ?? 0.95,
          stream: true,
        }
      );

      if (!response.body) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        callbacks.onToken(text);
        callbacks.onComplete(text);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const fullText = await parseSSEStream(reader, decoder, callbacks.onToken);
      callbacks.onComplete(fullText);
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async function continueWrite(context: WriteContext, options?: GenerationParams): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(context);

    if (!config.apiKey) throw new Error('请先配置API Key');

    const response = await makeAPIRequest(
      `${baseURL}/chat/completions`,
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.maxTokens ?? 2000,
        top_p: options?.topP ?? 0.95,
        stream: false,
      }
    );

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async function continueWriteStream(
    context: WriteContext,
    callbacks: StreamCallbacks,
    options?: GenerationParams
  ): Promise<void> {
    if (!config.apiKey) {
      callbacks.onError(new Error('请先配置API Key'));
      return;
    }

    try {
      const systemPrompt = buildSystemPrompt(context);
      const userPrompt = buildUserPrompt(context);

      const response = await makeAPIRequest(
        `${baseURL}/chat/completions`,
        {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: options?.temperature ?? 0.8,
          max_tokens: options?.maxTokens ?? 2000,
          top_p: options?.topP ?? 0.95,
          stream: true,
        }
      );

      if (!response.body) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        callbacks.onToken(text);
        callbacks.onComplete(text);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const fullText = await parseSSEStream(reader, decoder, callbacks.onToken);
      callbacks.onComplete(fullText);
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  return { name: config.provider || 'OpenAI', generate, generateStream, continueWrite, continueWriteStream };
}

async function createXiaomiService(config: AIConfig): Promise<AIServiceAdapter> {
  const baseURL = config.baseUrl || 'https://api.xiaomimimo.com/v1';
  const model = config.model || 'mimo-v2.5-pro';

  async function generate(prompt: string, options?: GenerationParams): Promise<string> {
    if (!config.apiKey) throw new Error('请先配置API Key');

    const response = await makeAPIRequest(
      `${baseURL}/chat/completions`,
      {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      {
        model,
        messages: [
          { role: 'system', content: '你是MiMo（中文名称也是MiMo），是小米公司研发的AI智能助手。' },
          { role: 'user', content: prompt },
        ],
        temperature: options?.temperature ?? 0.8,
        max_completion_tokens: options?.maxTokens ?? 2000,
        top_p: options?.topP ?? 0.95,
        stream: false,
      }
    );

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async function generateStream(
    prompt: string,
    callbacks: StreamCallbacks,
    options?: GenerationParams
  ): Promise<void> {
    if (!config.apiKey) {
      callbacks.onError(new Error('请先配置API Key'));
      return;
    }

    try {
      const response = await makeAPIRequest(
        `${baseURL}/chat/completions`,
        {
          'Content-Type': 'application/json',
          'api-key': config.apiKey,
        },
        {
          model,
          messages: [
            { role: 'system', content: '你是MiMo（中文名称也是MiMo），是小米公司研发的AI智能助手。' },
            { role: 'user', content: prompt },
          ],
          temperature: options?.temperature ?? 0.8,
          max_completion_tokens: options?.maxTokens ?? 2000,
          top_p: options?.topP ?? 0.95,
          stream: true,
        }
      );

      if (!response.body) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        callbacks.onToken(text);
        callbacks.onComplete(text);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const fullText = await parseSSEStream(reader, decoder, callbacks.onToken);
      callbacks.onComplete(fullText);
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async function continueWrite(context: WriteContext, options?: GenerationParams): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(context);
    return generate(systemPrompt + '\n\n' + userPrompt, options);
  }

  async function continueWriteStream(
    context: WriteContext,
    callbacks: StreamCallbacks,
    options?: GenerationParams
  ): Promise<void> {
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(context);
    await generateStream(systemPrompt + '\n\n' + userPrompt, callbacks, options);
  }

  return { name: '小米MiMo', generate, generateStream, continueWrite, continueWriteStream };
}

async function createGeminiService(config: AIConfig): Promise<AIServiceAdapter> {
  async function generate(prompt: string, options?: GenerationParams): Promise<string> {
    if (!config.apiKey) throw new Error('请先配置API Key');

    const response = await makeAPIRequest(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.apiKey}`,
      { 'Content-Type': 'application/json' },
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.8,
          maxOutputTokens: options?.maxTokens ?? 2000,
          topP: options?.topP ?? 0.95,
        },
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async function generateStream(
    prompt: string,
    callbacks: StreamCallbacks,
    options?: GenerationParams
  ): Promise<void> {
    if (!config.apiKey) {
      callbacks.onError(new Error('请先配置API Key'));
      return;
    }

    try {
      const response = await makeAPIRequest(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${config.apiKey}&alt=sse`,
        { 'Content-Type': 'application/json' },
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.8,
            maxOutputTokens: options?.maxTokens ?? 2000,
            topP: options?.topP ?? 0.95,
          },
        }
      );

      if (!response.body) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        callbacks.onToken(text);
        callbacks.onComplete(text);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (!data) continue;

          try {
            const json = JSON.parse(data);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullText += text;
              callbacks.onToken(text);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      callbacks.onComplete(fullText);
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async function continueWrite(context: WriteContext, options?: GenerationParams): Promise<string> {
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(context);
    return generate(systemPrompt + '\n\n' + userPrompt, options);
  }

  async function continueWriteStream(
    context: WriteContext,
    callbacks: StreamCallbacks,
    options?: GenerationParams
  ): Promise<void> {
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(context);
    await generateStream(systemPrompt + '\n\n' + userPrompt, callbacks, options);
  }

  return { name: 'Gemini', generate, generateStream, continueWrite, continueWriteStream };
}

export async function createAIService(config: AIConfig): Promise<AIServiceAdapter> {
  if (config.provider === 'gemini') {
    return createGeminiService(config);
  }
  if (config.provider === 'xiaomi-mimo' || config.provider === 'xiaomi-token' || config.provider === 'custom-xiaomi-mimo') {
    return createXiaomiService(config);
  }
  return createOpenAICompatibleService(config);
}
