import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, BookOpen, FileText, Users, MapPin, Sparkles, Download } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

const providers = [
  { id: 'deepseek', name: 'DeepSeek', model: 'deepseek-chat' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', model: 'deepseek-reasoner' },
  { id: 'gemini', name: 'Gemini', model: 'gemini-2.0-flash' },
  { id: 'xiaomi-mimo', name: '小米 MiMo', model: 'mimo-v2.5-pro' },
];

export default function Studio() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, chapters, characters, worldSettings, outlines, addChapter, deleteChapter, getProjectStats, exportProject } = useProjectStore();

  const project = projects.find(p => p.id === projectId);
  const projectChapters = chapters.filter(c => c.projectId === projectId).sort((a, b) => a.number - b.number);
  const projectCharacters = characters.filter(c => c.projectId === projectId);
  const projectWorld = worldSettings.find(w => w.projectId === projectId);
  const projectOutlines = outlines.filter(o => o.projectId === projectId);

  const stats = projectId ? getProjectStats(projectId) : { chapterCount: 0, totalWords: 0, charCount: 0 };

  if (!project) {
    return (
      <div className="h-screen bg-ink-700 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-ink-400 mx-auto mb-4" />
          <p className="text-ink-200 mb-4">项目不存在</p>
          <button onClick={() => navigate('/')} className="ink-button-primary">返回首页</button>
        </div>
      </div>
    );
  }

  const handleAddChapter = () => {
    const chapter = addChapter(projectId!, `第${projectChapters.length + 1}章`);
    navigate(`/studio/${projectId}/chapter/${chapter.id}`);
  };

  const handleExport = (format: 'md' | 'txt') => {
    if (!projectId) return;
    const content = exportProject(projectId, { format, includeChapterNumbers: true, includeChapterTitles: true });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteChapter = (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    if (confirm('确定删除这一章吗？')) {
      deleteChapter(chapterId);
    }
  };

  return (
    <div className="h-screen bg-ink-700 flex flex-col">
      {/* 顶部栏 */}
      <header className="border-b border-ink-500/30 bg-ink-700/80 backdrop-blur">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-ink-300 hover:text-ink-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">返回首页</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-gold/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-gold" />
              </div>
              <div>
                <h1 className="font-serif text-xl text-ink-50">{project.title}</h1>
                <p className="text-xs text-ink-400">{project.description || '暂无描述'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/discussion`)} className="ink-button text-sm">
              <Sparkles className="w-4 h-4 mr-1" />
              AI 讨论室
            </button>
            <button onClick={() => navigate(`/outline/${projectId}`)} className="ink-button text-sm">
              <FileText className="w-4 h-4 mr-1" />
              大纲
            </button>
            <div className="flex gap-2">
              <button onClick={() => handleExport('md')} className="ink-button text-sm">
                <Download className="w-4 h-4 mr-1" />
                导出 MD
              </button>
              <button onClick={() => handleExport('txt')} className="ink-button text-sm">
                <Download className="w-4 h-4 mr-1" />
                导出 TXT
              </button>
            </div>
            <button onClick={handleAddChapter} className="ink-button-primary text-sm">
              <Plus className="w-4 h-4 mr-1" />
              新建章节
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 项目统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="ink-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-gold/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-gold" />
                </div>
                <div>
                  <p className="text-2xl font-serif text-ink-50">{stats.chapterCount}</p>
                  <p className="text-xs text-ink-400">章节</p>
                </div>
              </div>
            </div>
            <div className="ink-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-serif text-ink-50">{stats.charCount}</p>
                  <p className="text-xs text-ink-400">角色</p>
                </div>
              </div>
            </div>
            <div className="ink-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-serif text-ink-50">{stats.totalWords}</p>
                  <p className="text-xs text-ink-400">字数</p>
                </div>
              </div>
            </div>
            <div className="ink-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-serif text-ink-50">{projectOutlines.length}</p>
                  <p className="text-xs text-ink-400">大纲节点</p>
                </div>
              </div>
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => navigate(`/characters/${projectId}`)} className="ink-card p-5 hover:border-amber-gold/30 transition-all text-left group">
              <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg text-ink-50 group-hover:text-amber-gold transition-colors">角色中心</h3>
              <Users className="w-5 h-5 text-amber-gold" />
              </div>
              <p className="text-sm text-ink-400">管理你的故事角色（{projectCharacters.length}）</p>
            </button>
            <button onClick={() => navigate(`/world/${projectId}`)} className="ink-card p-5 hover:border-amber-gold/30 transition-all text-left group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg text-ink-50 group-hover:text-amber-gold transition-colors">世界观设定</h3>
                <MapPin className="w-5 h-5 text-amber-gold" />
              </div>
              <p className="text-sm text-ink-400">{projectWorld ? '已配置世界观' : '还未设定世界观'}</p>
            </button>
            <button onClick={() => navigate(`/outline/${projectId}`)} className="ink-card p-5 hover:border-amber-gold/30 transition-all text-left group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg text-ink-50 group-hover:text-amber-gold transition-colors">故事大纲</h3>
                <FileText className="w-5 h-5 text-amber-gold" />
              </div>
              <p className="text-sm text-ink-400">规划你的故事结构（{projectOutlines.length} 节点）</p>
            </button>
          </div>

          {/* 章节列表 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-ink-50 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-gold" />
              章节列表
            </h2>
              <span className="text-sm text-ink-400">共 {projectChapters.length} 章</span>
            </div>

            {projectChapters.length === 0 ? (
              <div className="ink-card text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-ink-600/50 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-ink-400" />
              </div>
              <h3 className="text-xl text-ink-200 mb-2">还没有章节</h3>
              <p className="text-ink-300 mb-6">创建你的第一章开始创作</p>
              <button onClick={handleAddChapter} className="ink-button-primary">
                <Plus className="w-4 h-4 mr-1" />
                创建第一章
              </button>
            </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  onClick={() => navigate(`/studio/${projectId}/chapter/${chapter.id}`)}
                  className="ink-card p-5 cursor-pointer hover:border-amber-gold/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-gold/20 flex items-center justify-center">
                        <span className="text-sm text-amber-gold font-serif">{chapter.number}</span>
                      </div>
                      <div>
                        <h4 className="font-serif text-lg text-ink-50 group-hover:text-amber-gold transition-colors">
                          {chapter.title}
                        </h4>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                          chapter.status === 'completed' ? 'bg-green-500/20 text-green-400'
                          : chapter.status === 'ai_generated' ? 'bg-amber-gold/20 text-amber-gold'
                          : chapter.status === 'revised' ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-ink-500/50 text-ink-400'
                        }`}>
                          {chapter.status === 'completed' ? '已完成'
                          : chapter.status === 'ai_generated' ? 'AI生成'
                          : chapter.status === 'revised' ? '已修订'
                          : '草稿'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChapter(e, chapter.id)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <span className="text-sm">删除</span>
                    </button>
                  </div>
                  <p className="text-sm text-ink-300 line-clamp-2 mb-3">
                    {chapter.preview || '空白章节 - 点击开始写作'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-ink-400">
                    <span>{chapter.wordCount} 字</span>
                    <span>{new Date(chapter.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
