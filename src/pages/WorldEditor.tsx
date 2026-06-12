import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useProjectStore } from '@/stores/projectStore';

export default function WorldEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const { worldSettings, updateWorldSetting, projects } = useProjectStore();

  const project = projects.find(p => p.id === projectId);
  const setting = worldSettings.find(w => w.projectId === projectId);

  const [era, setEra] = useState(setting?.era || '');
  const [location, setLocation] = useState(setting?.location || '');
  const [societyRules, setSocietyRules] = useState(setting?.societyRules || '');
  const [customRules, setCustomRules] = useState<string[]>(setting?.customRules || []);
  const [newRule, setNewRule] = useState('');

  const handleSave = () => {
    updateWorldSetting(projectId!, {
      era,
      location,
      societyRules,
      customRules,
    });
  };

  const addRule = () => {
    if (newRule.trim()) {
      setCustomRules([...customRules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setCustomRules(customRules.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="世界观设定"
          showBack
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-ink-200 mb-6">为《{project?.title || '未命名'}》构建独特的世界</p>

            <div className="space-y-6">
              <div className="ink-card p-6">
                <h3 className="font-serif text-lg text-amber-gold mb-4">时代背景</h3>
                <textarea
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  onBlur={handleSave}
                  placeholder="描述故事发生的时代：古代/现代/未来、具体年份、重要历史事件..."
                  className="ink-textarea"
                  rows={4}
                />
              </div>

              <div className="ink-card p-6">
                <h3 className="font-serif text-lg text-amber-gold mb-4">地理环境</h3>
                <textarea
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onBlur={handleSave}
                  placeholder="描述主要场景：城市/乡村/国家、地理特征、重要地点..."
                  className="ink-textarea"
                  rows={4}
                />
              </div>

              <div className="ink-card p-6">
                <h3 className="font-serif text-lg text-amber-gold mb-4">社会规则</h3>
                <textarea
                  value={societyRules}
                  onChange={(e) => setSocietyRules(e.target.value)}
                  onBlur={handleSave}
                  placeholder="描述社会运行规则：政治制度、法律、文化习俗、禁忌..."
                  className="ink-textarea"
                  rows={4}
                />
              </div>

              <div className="ink-card p-6">
                <h3 className="font-serif text-lg text-amber-gold mb-4">自定义规则</h3>
                <p className="text-ink-300 text-sm mb-4">添加这个世界特有的规则或设定</p>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRule()}
                    placeholder="添加新规则..."
                    className="ink-input flex-1"
                  />
                  <button onClick={addRule} className="ink-button">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {customRules.length === 0 ? (
                  <p className="text-ink-400 text-sm text-center py-4">暂无自定义规则</p>
                ) : (
                  <div className="space-y-2">
                    {customRules.map((rule, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-ink-600/50 rounded-lg"
                      >
                        <span className="text-ink-100">{rule}</span>
                        <button
                          onClick={() => removeRule(index)}
                          className="p-1 text-ink-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
