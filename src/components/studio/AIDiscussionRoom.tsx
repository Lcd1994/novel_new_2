import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Sparkles, Send, Loader2, Wand2, BookOpen, ChevronDown, Trash2, Settings } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import { useProjectStore } from '@/stores/projectStore';
import { createAIService } from '@/services/ai/adapter';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

const providers = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', baseUrl: 'https://api.deepseek.com', model: 'deepseek-reasoner' },
  { id: 'gemini', name: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-2.0-flash' },
  { id: 'xiaomi-mimo', name: '小米MIMO', baseUrl: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5-pro' },
  { id: 'xiaomi-token', name: '小米Token Plan', baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1', model: 'mimo-v2.5-pro' },
];

export default function AIDiscussionRoom() {
  const { config, setConfig } = useAIStore();
  const { projects } = useProjectStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('novelforge-discussion-messages');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        content: '你好！我是你的AI小说创作助手。\n\n我可以帮你：\n1. 生成故事创意和概念\n2. 设计角色和世界观\n3. 规划故事大纲\n4. 润色和改进已有内容\n\n告诉我你想从哪里开始？',
        isUser: false,
        timestamp: Date.now(),
      },
    ];
  });
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.8);
  const [maxTokens, setMaxTokens] = useState(2000);

  const currentProvider = providers.find(p => p.id === config.provider);

  useEffect(() => {
    localStorage.setItem('novelforge-discussion-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setConfig({
        provider: providerId as any,
        baseUrl: provider.baseUrl,
        model: provider.model,
      });
    }
    setShowProviderDropdown(false);
  };

  const handleClearMessages = () => {
    if (confirm('确定要清空所有聊天记录吗？')) {
      setMessages([
        {
          id: '1',
          content: '你好！我是你的AI小说创作助手。\n\n我可以帮你：\n1. 生成故事创意和概念\n2. 设计角色和世界观\n3. 规划故事大纲\n4. 润色和改进已有内容\n\n告诉我你想从哪里开始？',
          isUser: false,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    if (!config.apiKey) {
      alert('请先在设置中配置API密钥');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsGenerating(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMessageId,
      content: '',
      isUser: false,
      timestamp: Date.now(),
    }]);

    try {
      const service = await createAIService(config);

      // Build context from messages for continuity
      const history = messages.slice(-10).map(m => 
        `${m.isUser ? '用户' : '助手'}：${m.content}`
      ).join('\n\n');

      const systemPrompt = `你是一位经验丰富的小说创作顾问。你的任务是帮助用户构思和创作小说。

请用专业、热情、富有创意的方式回答。

【回答原则】
1. 给出具体、可执行的建议，而不是泛泛而谈
2. 如果用户要求创意，提供2-3个不同方向的想法
3. 用生动的语言描绘场景和角色
4. 如果用户问的是写作技巧，给出具体的方法和例子
5. 保持对话的连贯性，参考前面的讨论内容
6. 适当鼓励用户，建立创作信心

如果用户只是随意聊天，请引导回到小说创作相关话题。`;

      let fullContent = '';
      let contentBuffer = '';

      await service.generateStream(
        `${systemPrompt}\n\n【历史对话】\n${history}\n\n【用户最新问题】\n${userInput}`,
        {
          onToken: (token) => {
            contentBuffer += token;
            fullContent += token;
            setMessages(prev => prev.map(m =>
              m.id === aiMessageId ? { ...m, content: fullContent } : m
            ));
          },
          onComplete: () => {
            setIsGenerating(false);
          },
          onError: (error) => {
            setMessages(prev => prev.map(m =>
              m.id === aiMessageId ? {
                ...m,
                content: `抱歉，生成时发生错误：${error.message}\n\n请检查：\n1. API密钥是否正确\n2. API服务是否可用\n3. 网络连接是否正常\n\n请在设置中重新配置后重试。`
              } : m
            ));
            setIsGenerating(false);
          }
        },
        {
          temperature,
          maxTokens,
        }
      );
    } catch (error) {
      setMessages(prev => prev.map(m =>
        m.id === aiMessageId ? {
          ...m,
          content: `抱歉，生成失败：${error instanceof Error ? error.message : '未知错误'}`
        } : m
      ));
      setIsGenerating(false);
    }
  };

  const quickPrompts = [
    { label: '给我一个科幻故事创意', icon: Sparkles },
    { label: '设计一个复杂的主角', icon: Wand2 },
    { label: '生成悬疑小说大纲', icon: BookOpen },
    { label: '构建奇幻世界观', icon: Wand2 },
    { label: '写一段对话场景', icon: MessageCircle },
    { label: '给角色添加弱点', icon: Sparkles },
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-ink-500/30 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-amber-gold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            AI讨论室
          </h3>
          <p className="text-ink-300 text-sm mt-1">与AI讨论你的故事创意</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowProviderDropdown(!showProviderDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 bg-ink-600/50 rounded-lg text-sm hover:bg-ink-600 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-gold" />
              <span>{currentProvider?.name || '选择AI'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showProviderDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProviderDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-ink-700 border border-ink-500/50 rounded-lg shadow-xl z-10 min-w-[180px]">
                {providers.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderChange(provider.id)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-ink-600 flex justify-between items-center ${
                      config.provider === provider.id ? 'text-amber-gold bg-ink-600/50' : 'text-ink-200'
                    }`}
                  >
                    <span>{provider.name}</span>
                    {config.provider === provider.id && (
                      <span className="w-2 h-2 bg-amber-gold rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-amber-gold/20 text-amber-gold' : 'text-ink-300 hover:bg-ink-600/50 hover:text-ink-100'}`}
            title="生成参数"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearMessages}
            className="p-1.5 text-ink-300 hover:text-red-400 hover:bg-ink-600/50 rounded-lg transition-colors"
            title="清空聊天"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="p-4 border-b border-ink-500/30 bg-ink-700/50">
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-ink-200 text-xs mb-2">
                创意度 (Temperature): {temperature}
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-amber-gold"
              />
              <p className="text-ink-400 text-xs mt-1">
                {temperature < 0.5 ? '更严谨、更一致' : temperature > 1.2 ? '更有想象力、更随机' : '平衡模式'}
              </p>
            </div>
            <div>
              <label className="block text-ink-200 text-xs mb-2">
                最大长度: {maxTokens} tokens
              </label>
              <input
                type="range"
                min="500"
                max="8000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-amber-gold"
              />
              <p className="text-ink-400 text-xs mt-1">
                约 {Math.round(maxTokens * 0.5)} 中文字符
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-xl whitespace-pre-wrap ${
                msg.isUser
                  ? 'bg-amber-gold/20 text-amber-gold rounded-tr-sm'
                  : 'bg-ink-600/80 text-ink-100 rounded-tl-sm'
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs text-ink-400 mt-2">
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-ink-600/80 text-ink-100 p-4 rounded-xl rounded-tl-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-gold" />
                <span className="text-sm text-ink-300">正在生成...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-ink-500/30">
        <div className="flex flex-wrap gap-2 mb-3">
          {quickPrompts.map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt.label)}
                disabled={isGenerating}
                className="ink-button text-xs flex items-center gap-1 disabled:opacity-50"
              >
                <Icon className="w-3 h-3" />
                {prompt.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入你的想法... (Enter发送)"
            className="ink-input flex-1"
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="ink-button-primary p-2 flex items-center gap-1"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {!config.apiKey && (
          <p className="text-amber-gold/80 text-xs text-center mt-2">
            请先在设置中配置API密钥
          </p>
        )}
      </div>
    </div>
  );
}
