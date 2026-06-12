import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Sparkles, Send, Loader2, Wand2, BookOpen, ChevronDown, Trash2, Settings } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import { useProjectStore } from '@/stores/projectStore';
import { createAIService } from '@/services/ai/adapter';
import { STORY_STRUCTURE_TEMPLATES } from '@/types';

const providers = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', baseUrl: 'https://api.deepseek.com', model: 'deepseek-reasoner' },
  { id: 'gemini', name: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-2.0-flash' },
  { id: 'xiaomi-mimo', name: '小米 MiMo', baseUrl: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5-pro' },
];

export default function Discussion() {
  const navigate = useNavigate();
  const { config, setConfig } = useAIStore();
  const { projects } = useProjectStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<{ id: string; content: string; isUser: boolean; timestamp: number }[]>(() => {
    const saved = localStorage.getItem('novelforge-discussion-messages');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        content: '你好！我是你的 AI 小说创作助手。\n\n我可以帮你构思故事创意、设计角色、规划大纲、优化文笔。\n\n告诉我你想从哪里开始？',
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const currentProvider = providers.find(p => p.id === config.provider);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  useEffect(() => {
    localStorage.setItem('novelforge-discussion-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setConfig({ provider: providerId, baseUrl: provider.baseUrl, model: provider.model });
    }
    setShowProviderDropdown(false);
  };

  const handleClearMessages = () => {
    if (confirm('确定要清空所有聊天记录吗？')) {
      setMessages([
        {
        id: '1',
        content: '已清空！我可以帮你构思故事创意、设计角色、规划大纲、优化文笔。告诉我你想从哪里开始？',
        isUser: false,
        timestamp: Date.now(),
      }
      ]);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleInsertTemplate = (template: { name: string; description: string; beats: string[] }) => {
    const beatsText = template.beats.slice(0, 10).map((b, i) => `${i + 1}. ${b}`).join('\n');
    const fullPrompt = `请帮我用"${template.name}"的故事结构，构思一个完整的故事大纲\n\n故事结构关键节点：\n${beatsText}\n\n请为我生成一个基于此结构的详细小说大纲，并给出每个节点的主要事件描述。`;
    setInput(fullPrompt);
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    if (!config.apiKey) {
      alert('请先在设置中配置 API 密钥');
      navigate('/settings');
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsGenerating(true);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage = { id: aiMessageId, content: '', isUser: false, timestamp: Date.now() };

    try {
      setMessages([...newMessages, aiMessage]);
      const service = await createAIService(config);
      const contextText = newMessages.slice(-10).map(m => (m.isUser ? `用户：${m.content}` : `助手：${m.content}`)).join('\n\n');
      const projectContext = selectedProject
        ? `\n\n【当前项目】书名：${selectedProject.title}${selectedProject.description ? '\n简介：' + selectedProject.description : ''}`
        : '';

      await service.generateStream(
        `你是一位经验丰富的小说创作顾问，擅长帮助作者构思和创作小说。\n\n请用专业、富有创意、具体的建议回答用户的问题。如果用户要求创意，提供具体方向。使用中文回答用户的输入${projectContext}\n\n【历史对话】\n${contextText}\n\n【用户最新问题】\n${input}`,
        {
          onToken: (token) => {
            setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: m.content + token } : m));
          },
          onComplete: () => setIsGenerating(false),
          onError: (error) => {
            setMessages(prev => prev.map(m =>
              m.id === aiMessageId ? { ...m, content: `生成失败：${error.message}\n\n请检查 API 密钥是否正确。` } : m));
            setIsGenerating(false);
          }
        },
        {
          temperature,
          maxTokens,
        }
      );
    } catch (error: any) {
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: `生成失败：${error.message}` } : m));
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-ink-700">
      <header className="p-4 border-b border-ink-500/30 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-amber-gold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            AI 讨论室
          </h3>
          <p className="text-ink-300 text-sm mt-1">
            {selectedProject ? `正在讨论《${selectedProject.title}》` : '与 AI 讨论你的故事创意'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-ink-600 border border-ink-500 rounded-lg px-3 py-2 text-sm text-ink-200"
            >
              <option value="">选择项目（可选）</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-amber-gold/20 text-amber-gold' : 'text-ink-300 hover:bg-ink-600'}`}
            title="生成参数"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearMessages}
            className="p-1.5 text-ink-300 hover:text-red-400 hover:bg-ink-600 hover:bg-ink-600/50 rounded-lg transition-colors"
            title="清空聊天"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="p-4 border-b border-ink-500/30 bg-ink-700/50 space-y-2">
          <div>
            <button
              onClick={() => setShowProviderDropdown(!showProviderDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 bg-ink-600/50 rounded-lg text-sm hover:bg-ink-600"
            >
              <span className="text-ink-200">服务商：{currentProvider?.name || '选择 AI'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showProviderDropdown && (
              <div className="absolute right-4 bg-ink-600 border border-ink-500 rounded-lg shadow-xl z-10 min-w-[180px]">
                {providers.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderChange(provider.id)}
                    className="w-full px-4 py-2 text-sm hover:bg-ink-500 text-left"
                  >
                    {provider.name}
                    {config.provider === provider.id && (
                      <span className="text-amber-gold ml-2">选中</span>
                    )}
                  </button>
                ))}
              </div>
              )}
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-ink-200 text-xs mb-1">创意度: {temperature}</label>
              <input
                type="range" min="0.1" max="2" step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-amber-gold"
              />
            </div>
            <div>
              <label className="block text-ink-200 text-xs mb-1">最大长度: {maxTokens}</label>
              <input
                type="range" min="500" max="8000" step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-2 bg-ink-600 rounded-lg appearance-none cursor-pointer accent-amber-gold"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-xl whitespace-pre-wrap ${msg.isUser ? 'bg-amber-gold/20 text-amber-gold rounded-tr-sm' : 'bg-ink-600/80 text-ink-100 rounded-tl-sm'}`}>
              <p>{msg.content}</p>
              <p className="text-xs text-ink-400 mt-2">
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-ink-600/80 text-ink-100 p-4 rounded-xl rounded-tl-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-gold" />
                <span className="text-sm text-ink-300">正在思考...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-ink-500/30 space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { label: '给我一个科幻故事创意', icon: Sparkles },
            { label: '设计一个复杂的主角', icon: Wand2 },
            { label: '生成悬疑小说大纲', icon: BookOpen },
            { label: '构建奇幻世界观', icon: Wand2 },
            { label: '写一段对话场景', icon: MessageCircle },
            { label: '给角色添加弱点', icon: Sparkles },
          ].map((prompt, index) => {
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
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-ink-400">故事结构模板：</span>
          {STORY_STRUCTURE_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => handleInsertTemplate(template)}
              className="ink-button text-xs"
            >
              {template.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入你的想法... (Enter发送，Shift+Enter换行)"
            className="ink-input flex-1"
            disabled={isGenerating}
          />
          <button onClick={handleSend} disabled={!input.trim() || isGenerating} className="ink-button-primary p-2 flex items-center gap-1">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {!config.apiKey && (
            <p className="text-amber-gold/80 text-xs text-center">
              请先在设置中配置 API 密钥
            </p>
          )}
      </div>
    </div>
  );
}
