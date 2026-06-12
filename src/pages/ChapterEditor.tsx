import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Wand2, Loader2, ChevronLeft, ChevronRight, FileText, Settings, X } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useAIStore } from '@/stores/aiStore';
import { createAIService } from '@/services/ai/adapter';
import { STORY_STRUCTURE_TEMPLATES } from '@/types';
import type { AIGenerateMode } from '@/types';

const WRITING_MODES: Array<{ value: AIGenerateMode; label: string; description: string; icon: string }> = [
  { value: 'continue', label: '续写', description: '根据已有内容自然续写', icon: '✍️' },
  { value: 'advance', label: '推进剧情', description: '引入新事件推动故事', icon: '🚀' },
  { value: 'polish', label: '润色', description: '优化文笔增强表达', icon: '✨' },
  { value: 'atmosphere', label: '氛围描写', description: '增强场景氛围', icon: '🌅' },
  { value: 'dialogue', label: '对话', description: '创作角色对话', icon: '💬' },
  { value: 'action', label: '动作场景', description: '创作动作戏', icon: '⚔️' },
];

export default function ChapterEditor() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { chapters, projects, characters, worldSettings, getChapterContent, updateChapterContent } = useProjectStore();
  const { config } = useAIStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const project = projects.find((p) => p.id === projectId);
  const chapter = chapters.find((c) => c.id === chapterId);
  const projectChapters = chapters.filter((c) => c.projectId === projectId).sort((a, b) => a.number - b.number);
  const projectCharacters = characters.filter((c) => c.projectId === projectId);
  const projectWorld = worldSettings.find((w) => w.projectId === projectId);

  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [selectedMode, setSelectedMode] = useState<AIGenerateMode>('continue');
  const [customInstruction, setCustomInstruction] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState('');
  const [temperature, setTemperature] = useState(0.8);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (chapterId) {
      const saved = getChapterContent(chapterId);
      setContent(saved);
    }
  }, [chapterId, getChapterContent]);

  const wordCount = content.length;

  const handleSave = () => {
    if (!chapterId) return;
    setIsSaving(true);
    updateChapterContent(chapterId, content);
    setLastSaved(Date.now());
    setTimeout(() => setIsSaving(false), 500);
  };

  const getContextForAI = () => ({
    projectTitle: project?.title || '未命名作品',
    worldSetting: projectWorld || {
      id: '',
      projectId: '',
      era: '',
      location: '',
      societyRules: '',
      customRules: [],
    },
    characters: projectCharacters,
    currentChapter: {
      id: chapter?.id || '',
      projectId: projectId || '',
      number: chapter?.number || 1,
      title: chapter?.title || '新章节',
      content: content.slice(-1500),
      preview: chapter?.preview || '',
      wordCount,
      status: (chapter?.status || 'draft') as 'draft' | 'ai_generated' | 'revised' | 'completed',
      createdAt: chapter?.createdAt || 0,
      updatedAt: chapter?.updatedAt || 0,
    },
    mode: selectedMode,
    customPrompt: customInstruction || undefined,
  });

  const handleGenerate = async () => {
    if (!config.apiKey) {
      alert('请先在设置中配置 API 密钥');
      navigate('/settings');
      return;
    }

    setIsGenerating(true);
    setGeneratedPreview('');

    try {
      const service = await createAIService(config);
      const ctx = getContextForAI();
      const result = await service.continueWrite(ctx);
      setGeneratedPreview(result);
    } catch (error: any) {
      console.error('生成失败:', error);
      setGeneratedPreview(`生成失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptGenerated = () => {
    if (!generatedPreview.trim()) return;
    const newContent = content + (content && !content.endsWith('\n') ? '' : '\n') + generatedPreview;
    setContent(newContent);
    setGeneratedPreview('');
    if (chapterId) {
      updateChapterContent(chapterId, newContent);
      setLastSaved(Date.now());
    }
  };

  const handleReplaceWithGenerated = () => {
    if (!generatedPreview.trim() || !content.trim()) return;
    setContent(generatedPreview);
    setGeneratedPreview('');
    if (chapterId) {
      updateChapterContent(chapterId, generatedPreview);
      setLastSaved(Date.now());
    }
  };

  const handleDiscardGenerated = () => {
    setGeneratedPreview('');
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    const currentIdx = projectChapters.findIndex((c) => c.id === chapterId);
    if (direction === 'prev' && currentIdx > 0) {
      navigate(`/studio/${projectId}/chapter/${projectChapters[currentIdx - 1].id}`);
    } else if (direction === 'next' && currentIdx < projectChapters.length - 1) {
      navigate(`/studio/${projectId}/chapter/${projectChapters[currentIdx + 1].id}`);
    }
  };

  const currentIdx = projectChapters.findIndex((c) => c.id === chapterId);

  if (!chapter) {
    return (
      <div className="flex h-screen bg-ink-700 items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-ink-400 mx-auto mb-4" />
          <p className="text-ink-200 mb-4">章节不存在</p>
          <button onClick={() => navigate(`/studio/${projectId}`)} className="ink-button">返回工作室</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-ink-700">
      {/* 顶部工具栏 */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b border-ink-500/30 bg-ink-700/95 backdrop-blur z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/studio/${projectId}`)}
            className="flex items-center gap-2 text-ink-300 hover:text-ink-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回工作室</span>
          </button>
          <div>
            <h2 className="font-serif text-lg text-amber-gold">{chapter.title}</h2>
            <p className="text-xs text-ink-400">
              {project?.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-ink-400">
          <span>{wordCount} 字</span>
        </div>
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              showAIPanel ? 'bg-amber-gold/20 text-amber-gold border border-amber-gold/30' : 'bg-ink-600/50 text-ink-200 hover:bg-ink-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI 写作</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="ink-button-primary flex items-center gap-2 text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </header>

      {/* 主体内容区 */}
      <div className="flex-1 flex pt-14">
        {/* 编辑区 */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateChapter('prev')}
                disabled={currentIdx <= 0}
                className="p-1.5 rounded-lg bg-ink-600/50 text-ink-300 hover:bg-ink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-ink-400">
                {currentIdx + 1} / {projectChapters.length}
              </span>
              <button
                onClick={() => navigateChapter('next')}
                disabled={currentIdx >= projectChapters.length - 1}
                className="p-1.5 rounded-lg bg-ink-600/50 text-ink-300 hover:bg-ink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-ink-400">最后保存：{new Date(lastSaved).toLocaleTimeString('zh-CN')}</span>
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            placeholder="在这里开始你的创作...

可以直接编写，或使用右侧 AI 助手帮你续写、润色或生成新内容。"
            className="flex-1 w-full bg-ink-800/30 border border-ink-600/50 rounded-lg p-6 text-ink-100 leading-loose resize-none focus:outline-none focus:border-amber-gold/30 focus:ring-1 focus:ring-amber-gold/10 placeholder:text-ink-400 font-serif text-base"
          />
        </div>

        {/* AI 写作面板 */}
        {showAIPanel && (
          <div className="w-96 border-l border-ink-500/30 bg-ink-800/50 flex flex-col">
            <div className="p-4 border-b border-ink-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-amber-gold flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  AI 写作助手
                </h3>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-50 hover:bg-ink-700/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 写作模式选择 */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {WRITING_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedMode(mode.value)}
                    className={`p-2 rounded-lg text-sm transition-all text-left ${
                      selectedMode === mode.value
                        ? 'bg-amber-gold/20 text-amber-gold border border-amber-gold/30'
                        : 'bg-ink-700/50 text-ink-200 hover:bg-ink-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </div>
                    <p className="text-xs text-ink-400 mt-1">{mode.description}</p>
                  </button>
                ))}
              </div>

              {/* 自定义指令 */}
              <div className="mb-4">
                <label className="block text-ink-200 text-sm mb-2">自定义指令（可选）</label>
                <textarea
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="例如：在这段要写一段关于主角的内心独白..."
                  className="w-full bg-ink-700 border border-ink-600/50 rounded-lg p-3 text-sm text-ink-100 leading-relaxed resize-none focus:outline-none focus:border-amber-gold/30"
                  rows={3}
                />
              </div>

              {/* 故事结构模板 */}
              <div className="mb-4">
                <label className="block text-ink-200 text-sm mb-2">故事结构模板</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full bg-ink-700 border border-ink-600/50 rounded-lg p-2 text-sm text-ink-100"
                >
                  <option value="">不使用模板</option>
                  {STORY_STRUCTURE_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="mt-2 p-3 bg-ink-700/50 rounded-lg">
                    <p className="text-xs text-ink-400 mb-2">关键节拍：</p>
                    <div className="space-y-1">
                      {STORY_STRUCTURE_TEMPLATES.find((t) => t.id === selectedTemplate)?.beats
                        .slice(0, 5)
                        .map((beat, i) => (
                          <p key={i} className="text-xs text-ink-200">{beat}</p>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI 参数 */}
              <div className="mb-4 p-3 bg-ink-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Settings className="w-4 h-4 text-amber-gold" />
                  <span className="text-xs text-ink-400">生成参数</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ink-300">创意程度</span>
                      <span className="text-amber-gold">{temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-amber-gold"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ink-300">最大长度</span>
                      <span className="text-amber-gold">{maxTokens} tokens</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="4000"
                      step="100"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full accent-amber-gold"
                    />
                  </div>
                </div>
              </div>

              {/* 生成按钮 */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !config.apiKey}
                className="w-full ink-button-primary flex items-center justify-center gap-2 py-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 正在思考中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    开始生成
                  </>
                )}
              </button>

              {!config.apiKey && (
                <p className="text-xs text-center mt-2 text-amber-gold/80">请先在设置中配置 API 密钥</p>
              )}
            </div>

            {/* 生成结果预览 */}
            {generatedPreview && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="ink-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-amber-gold text-sm">生成结果</h4>
                    <span className="text-xs text-ink-400">{generatedPreview.length} 字</span>
                  </div>
                  <div className="text-sm text-ink-100 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto mb-4">
                    {generatedPreview}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAcceptGenerated} className="ink-button-primary flex-1 text-sm">
                    追加到正文
                  </button>
                    <button onClick={handleReplaceWithGenerated} className="ink-button flex-1 text-sm">
                    替换
                  </button>
                    <button onClick={handleDiscardGenerated} className="ink-button flex-1 text-sm">
                    放弃
                  </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
