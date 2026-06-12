import { useState } from 'react';
import { Key, Globe, Check, AlertCircle, Plus, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useAIStore } from '@/stores/aiStore';

export interface CustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
}

export default function Settings() {
  const { config, setConfig } = useAIStore();
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || 'https://api.deepseek.com');
  const [model, setModel] = useState(config.model || 'deepseek-chat');
  const [saved, setSaved] = useState(false);
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', baseUrl: '', model: '' });

  const providers = [
    { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
    { id: 'gemini', name: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-pro' },
    { id: 'xiaomi', name: '小米MIMO', baseUrl: 'https://api.mimo.mi.com', model: 'mimo-7b' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', baseUrl: 'https://api.deepseek.com', model: 'deepseek-r1' },
    ...customProviders.map(p => ({ ...p, id: `custom-${p.id}` })),
  ];

  const handleSave = () => {
    setConfig({
      provider: config.provider,
      apiKey,
      baseUrl,
      model,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProviderChange = (providerId: string, provider: typeof providers[0]) => {
    setConfig({ provider: providerId as any });
    setBaseUrl(provider.baseUrl);
    setModel(provider.model);
  };

  const addCustomProvider = () => {
    if (!newProvider.name.trim() || !newProvider.baseUrl.trim()) return;
    const provider: CustomProvider = {
      id: Date.now().toString(),
      name: newProvider.name,
      baseUrl: newProvider.baseUrl,
      model: newProvider.model || 'chat-completion',
    };
    setCustomProviders([...customProviders, provider]);
    setNewProvider({ name: '', baseUrl: '', model: '' });
    setShowCustomForm(false);
  };

  const removeCustomProvider = (id: string) => {
    setCustomProviders(customProviders.filter(p => p.id !== id));
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="设置" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="ink-card p-6">
              <h3 className="font-serif text-lg text-amber-gold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                AI服务商配置
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-ink-200 text-sm mb-2">选择服务商</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {providers.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => handleProviderChange(provider.id, provider)}
                        className={`p-3 rounded-lg text-sm transition-all ${
                          config.provider === provider.id
                            ? 'bg-amber-gold/20 text-amber-gold border border-amber-gold/30'
                            : 'bg-ink-600/50 text-ink-200 hover:bg-ink-600'
                        }`}
                      >
                        {provider.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowCustomForm(true)}
                      className="p-3 rounded-lg text-sm bg-ink-600/50 text-ink-300 hover:bg-ink-600 hover:text-ink-200 transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      添加自定义
                    </button>
                  </div>
                </div>

                {showCustomForm && (
                  <div className="p-4 bg-ink-600/30 rounded-lg space-y-3">
                    <div>
                      <label className="block text-ink-200 text-sm mb-1">服务商名称</label>
                      <input
                        type="text"
                        value={newProvider.name}
                        onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                        placeholder="例如：小米MIMO"
                        className="ink-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-200 text-sm mb-1">API Base URL</label>
                      <input
                        type="text"
                        value={newProvider.baseUrl}
                        onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                        placeholder="https://api.example.com"
                        className="ink-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-200 text-sm mb-1">模型名称（可选）</label>
                      <input
                        type="text"
                        value={newProvider.model}
                        onChange={(e) => setNewProvider({ ...newProvider, model: e.target.value })}
                        placeholder="例如：chat-completion"
                        className="ink-input text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addCustomProvider}
                        className="ink-button flex-1 text-sm"
                      >
                        添加
                      </button>
                      <button
                        onClick={() => setShowCustomForm(false)}
                        className="ink-button flex-1 text-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-ink-200 text-sm mb-2">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="输入你的API密钥..."
                    className="ink-input"
                  />
                </div>

                <div>
                  <label className="block text-ink-200 text-sm mb-2">API Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.deepseek.com"
                    className="ink-input"
                  />
                </div>

                <div>
                  <label className="block text-ink-200 text-sm mb-2">模型名称</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="deepseek-chat"
                    className="ink-input"
                  />
                </div>

                <button
                  onClick={handleSave}
                  className="ink-button-primary w-full flex items-center justify-center gap-2"
                >
                  {saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      已保存
                    </>
                  ) : (
                    '保存配置'
                  )}
                </button>
              </div>
            </div>

            <div className="ink-card p-6">
              <h3 className="font-serif text-lg text-amber-gold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                关于
              </h3>

              <div className="space-y-3 text-ink-200 text-sm">
                <p>
                  <strong className="text-ink-50">NovelForge</strong> 是一款由AI驱动的沉浸式小说创作工具。
                </p>
                <p>
                  你可以设定世界观、创建角色、设计故事大纲，然后让AI自动生成精彩的小说章节。
                </p>
                <p>
                  角色会根据剧情发展动态进化，你随时可以微调干预。
                </p>
              </div>

              <div className="mt-4 p-3 bg-ink-600/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-gold mt-0.5" />
                  <p className="text-ink-300 text-xs">
                    你的API密钥仅存储在本地浏览器中，不会上传到任何服务器。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
