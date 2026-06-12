import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Send, Loader2, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import ThreeColumnLayout from '@/components/layout/ThreeColumnLayout';
import { useProjectStore } from '@/stores/projectStore';
import { useAIStore } from '@/stores/aiStore';
import { useUIStore } from '@/stores/uiStore';
import { createAIService } from '@/services/ai/adapter';
import type { AIGenerateMode, Character, WorldSetting } from '@/types';

export default function Studio() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProjectId, chapters, characters, worldSettings, addChapter, updateChapter } = useProjectStore();
  const { config } = useAIStore();
  const { rightPanelOpen, toggleRightPanel, currentView, setCurrentView } = useUIStore();

  const [customPrompt, setCustomPrompt] = useState('');
  const [generatingMode, setGeneratingMode] = useState<AIGenerateMode>('continue');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const projectChapters = chapters.filter(c => c.projectId === projectId).sort((a, b) => a.number - b.number);
  const projectCharacters = characters.filter(c => c.projectId === projectId);
  const projectWorld = worldSettings.find(w => w.projectId === projectId);

  if (currentProjectId !== projectId) {
    return (
      <div className="min-h-screen bg-ink-700 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-ink-400 mx-auto mb-4" />
          <p className="text-ink-200">请先从仪表盘选择一个项目</p>
          <button
            onClick={() => navigate('/')}
            className="ink-button mt-4"
          >
            返回仪表盘
          </button>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!config.apiKey) {
      alert('请先在设置中配置AI API密钥');
      navigate('/settings');
      return;
    }

    const currentChapter = projectChapters[0];
    if (!currentChapter) {
      alert('请先创建章节');
      return;
    }

    setGenerating(true);
    setGeneratedContent('');

    try {
      const service = await createAIService(config);

      const content = await service.continueWrite({
        projectTitle: '未命名小说',
        worldSetting: projectWorld || { id: '', projectId: '', era: '现代', location: '城市', societyRules: '', customRules: [] },
        characters: projectCharacters,
        currentChapter,
        mode: generatingMode,
        customPrompt,
      });

      setGeneratedContent(content);
      updateChapter(currentChapter.id, {
        content: currentChapter.content + '\n\n' + content,
        status: 'ai_generated',
      });
    } catch (error) {
      console.error('AI生成失败:', error);
      alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddChapter = () => {
    const chapter = addChapter(projectId!, `第${projectChapters.length + 1}章`);
    navigate(`/studio/${projectId}/chapter/${chapter.id}`);
  };

  const leftPanel = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-ink-500/30">
        <h3 className="font-serif text-lg text-ink-50 mb-3">角色列表</h3>
        <button
          onClick={() => navigate(`/characters/${projectId}`)}
          className="ink-button w-full text-sm"
        >
          管理角色
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {projectCharacters.length === 0 ? (
          <p className="text-ink-400 text-sm text-center py-4">暂无角色，请先创建</p>
        ) : (
          projectCharacters.map(char => (
            <div key={char.id} className="ink-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-ink-50 font-medium">{char.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  char.role === 'protagonist' ? 'bg-amber-gold/20 text-amber-gold' : 'bg-ink-500/50 text-ink-200'
                }`}>
                  {char.role === 'protagonist' ? '主角' : char.role === 'supporting' ? '配角' : '龙套'}
                </span>
              </div>
              <p className="text-ink-300 text-xs">
                {char.personality.map(p => p.tag).join(', ') || '性格待定'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const centerPanel = (
    <div className="flex flex-col h-full">
      <header className="h-14 border-b border-ink-500/30 flex items-center justify-between px-4 bg-ink-700/30">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-gold" />
          <span className="text-ink-50 font-medium">章节列表</span>
        </div>
        <button onClick={handleAddChapter} className="ink-button text-sm">
          新建章节
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {projectChapters.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-ink-400 mx-auto mb-3" />
            <p className="text-ink-300">还没有章节</p>
            <button onClick={handleAddChapter} className="ink-button-primary mt-3">
              创建第一章
            </button>
          </div>
        ) : (
          projectChapters.map(chapter => (
            <div
              key={chapter.id}
              className={`ink-card p-4 cursor-pointer hover:border-amber-gold/30 transition-all ${
                chapter.status === 'ai_generated' ? 'border-l-2 border-l-amber-gold' : ''
              }`}
              onClick={() => {
                updateChapter(chapter.id, { status: chapter.status === 'draft' ? 'ai_generated' : chapter.status });
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-ink-50 font-medium">{chapter.title}</h4>
                <ChevronRight className="w-4 h-4 text-ink-400" />
              </div>
              <p className="text-ink-300 text-sm line-clamp-2">
                {chapter.content || '空白章节'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  chapter.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  chapter.status === 'ai_generated' ? 'bg-amber-gold/20 text-amber-gold' :
                  'bg-ink-500/50 text-ink-300'
                }`}>
                  {chapter.status === 'completed' ? '已完成' :
                   chapter.status === 'ai_generated' ? 'AI已生成' :
                   chapter.status === 'revised' ? '已修订' : '草稿'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const rightPanel = rightPanelOpen ? (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-ink-500/30 flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink-50">AI创作</h3>
        <button onClick={toggleRightPanel} className="text-ink-300 hover:text-ink-50">
          收起
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-ink-200 text-sm mb-2">创作模式</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'continue', label: '续写' },
              { value: 'advance', label: '推进剧情' },
              { value: 'polish', label: '润色' },
              { value: 'atmosphere', label: '氛围描写' },
            ].map(mode => (
              <button
                key={mode.value}
                onClick={() => setGeneratingMode(mode.value as AIGenerateMode)}
                className={`p-2 rounded-lg text-sm transition-all ${
                  generatingMode === mode.value
                    ? 'bg-amber-gold/20 text-amber-gold border border-amber-gold/30'
                    : 'bg-ink-600/50 text-ink-200 hover:bg-ink-600'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-ink-200 text-sm mb-2">额外指令</label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="描述你想要的剧情发展方向..."
            className="ink-textarea text-sm"
            rows={4}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !config.apiKey}
          className="ink-button-primary w-full flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              触发AI创作
            </>
          )}
        </button>

        {!config.apiKey && (
          <p className="text-amber-gold/80 text-xs text-center">
            请先配置API密钥
            <button
              onClick={() => navigate('/settings')}
              className="underline ml-1"
            >
              去设置
            </button>
          </p>
        )}

        {generatedContent && (
          <div className="mt-4">
            <label className="block text-ink-200 text-sm mb-2">生成结果</label>
            <div className="ink-card p-4 max-h-64 overflow-y-auto">
              <p className="text-ink-100 whitespace-pre-wrap leading-relaxed">
                {generatedContent}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-full">
      <button
        onClick={toggleRightPanel}
        className="ink-button"
      >
        展开AI面板
      </button>
    </div>
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <ThreeColumnLayout
        leftPanel={leftPanel}
        centerPanel={centerPanel}
        rightPanel={rightPanel}
        leftWidth="w-72"
        rightWidth="w-80"
      />
    </div>
  );
}
