import { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, Send, Loader2, Wand2, BookOpen, Users, ChevronDown, Trash2 } from 'lucide-react';
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
  { id: 'deepseek', name: 'DeepSeek', model: 'deepseek-chat' },
  { id: 'gemini', name: 'Gemini', model: 'gemini-pro' },
  { id: 'xiaomi-mimo', name: '小米MIMO', model: 'mimo-v2.5-pro' },
  { id: 'xiaomi-token', name: '小米Token Plan', model: 'mimo-v2.5-pro' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', model: 'deepseek-r1' },
];

export default function AIDiscussionRoom() {
  const { config, setConfig } = useAIStore();
  const { createProject, addOutline, addCharacter, updateWorldSetting } = useProjectStore();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('novelforge-discussion-messages');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        content: '你好！我是你的AI小说创作助手。告诉我你的想法，我可以帮你：\n\n1. 生成故事创意和概念\n2. 设计故事大纲\n3. 创建角色设定\n4. 构建世界观\n\n你想从哪里开始？',
        isUser: false,
        timestamp: Date.now(),
      },
    ];
  });
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  const currentProvider = providers.find(p => p.id === config.provider);

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setConfig({
        provider: providerId as any,
        baseUrl: providerId === 'deepseek' ? 'https://api.deepseek.com' :
                 providerId === 'deepseek-r1' ? 'https://api.deepseek.com' :
                 providerId === 'gemini' ? 'https://generativelanguage.googleapis.com' :
                 providerId === 'xiaomi-mimo' ? 'https://api.xiaomimimo.com/v1' :
                 'https://token-plan-cn.xiaomimimo.com/v1',
        model: provider.model,
      });
      setShowProviderDropdown(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('novelforge-discussion-messages', JSON.stringify(messages));
  }, [messages]);

  const handleClearMessages = () => {
    if (confirm('确定要清空所有聊天记录吗？')) {
      setMessages([
        {
          id: '1',
          content: '你好！我是你的AI小说创作助手。告诉我你的想法，我可以帮你：\n\n1. 生成故事创意和概念\n2. 设计故事大纲\n3. 创建角色设定\n4. 构建世界观\n\n你想从哪里开始？',
          isUser: false,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !config.apiKey) {
      if (!config.apiKey) {
        alert('请先配置API密钥');
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      const service = await createAIService(config);
      
      const systemPrompt = `
你是一位专业的小说创作顾问和故事策划师。请用简洁、有创意的方式回答用户的问题。

用户可能会问：
1. 故事创意 - 给我一个独特的故事概念
2. 角色设定 - 帮我设计一个主角/配角
3. 故事大纲 - 根据我的想法生成大纲
4. 世界观 - 构建一个独特的世界设定

请用生动有趣的方式回应，给出具体的例子和建议。
      `.trim();

      const response = await service.generate(systemPrompt + '\n\n用户：' + input);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI请求失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `抱歉，生成失败：${error instanceof Error ? error.message : '未知错误'}`,
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const quickPrompts = [
    { label: '给我一个科幻故事创意', icon: Sparkles },
    { label: '帮我设计一个主角', icon: Users },
    { label: '生成一个悬疑故事大纲', icon: BookOpen },
    { label: '构建一个奇幻世界', icon: Wand2 },
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-ink-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg text-amber-gold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              AI讨论室
            </h3>
            <p className="text-ink-300 text-sm mt-1">与AI讨论你的故事创意</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProviderDropdown(!showProviderDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 bg-ink-600/50 rounded-lg text-sm hover:bg-ink-600 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-gold" />
              <span>{currentProvider?.name || '选择AI'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showProviderDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={handleClearMessages}
              className="p-1.5 text-ink-300 hover:text-ink-100 hover:bg-ink-600/50 rounded-lg transition-colors"
              title="清空聊天记录"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {showProviderDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-ink-700 border border-ink-500/50 rounded-lg shadow-xl z-10 min-w-[160px]">
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
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-xl ${
                msg.isUser
                  ? 'bg-amber-gold/20 text-amber-gold rounded-tr-sm'
                  : 'bg-ink-600/80 text-ink-100 rounded-tl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
          <div className="flex justify-start animate-fade-in">
            <div className="bg-ink-600/80 text-ink-100 p-4 rounded-xl rounded-tl-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-gold" />
                <span className="text-sm">{currentProvider?.name}正在思考...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-ink-500/30">
        <div className="flex flex-wrap gap-2 mb-3">
          {quickPrompts.map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt.label)}
                className="ink-button text-xs flex items-center gap-1"
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
            placeholder="输入你的想法..."
            className="ink-input flex-1"
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !config.apiKey || isGenerating}
            className="ink-button-primary p-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
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
