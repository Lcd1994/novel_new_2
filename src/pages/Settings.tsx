import { useState } from 'react';
import { Key, Globe, Check, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useAIStore } from '@/stores/aiStore';

export default function Settings() {
  const { config, setConfig } = useAIStore();
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || 'https://api.deepseek.com');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setConfig({
      provider: 'deepseek',
      apiKey,
      baseUrl,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProviderChange = (provider: 'deepseek' | 'gemini') => {
    setConfig({ provider });
    if (provider === 'deepseek') {
      setBaseUrl('https://api.deepseek.com');
    } else if (provider === 'gemini') {
      setBaseUrl('https://generativelanguage.googleapis.com');
    }
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
                  <label className="block text-ink-200 text-sm mb-2">服务商</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleProviderChange('deepseek')}
                      className={`p-3 rounded-lg text-sm transition-all ${
                        config.provider === 'deepseek'
                          ? 'bg-amber-gold/20 text-amber-gold border border-amber-gold/30'
                          : 'bg-ink-600/50 text-ink-200 hover:bg-ink-600'
                      }`}
                    >
                      DeepSeek
                    </button>
                    <button
                      onClick={() => handleProviderChange('gemini')}
                      className={`p-3 rounded-lg text-sm transition-all ${
                        config.provider === 'gemini'
                          ? 'bg-amber-gold/20 text-amber-gold border border-amber-gold/30'
                          : 'bg-ink-600/50 text-ink-200 hover:bg-ink-600'
                      }`}
                    >
                      Gemini
                    </button>
                  </div>
                </div>

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
