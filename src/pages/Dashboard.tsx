import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Trash2, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, createProject, setCurrentProject, deleteProject } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const project = createProject(newTitle, newDesc);
    setCurrentProject(project.id);
    setShowModal(false);
    setNewTitle('');
    setNewDesc('');
    navigate(`/studio/${project.id}`);
  };

  const handleOpenProject = (id: string) => {
    setCurrentProject(id);
    navigate(`/studio/${id}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-ink-700 text-ink-50">
      <header className="border-b border-ink-500/30 bg-ink-700/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-gold" />
            <h1 className="font-serif text-2xl text-amber-gold">NovelForge</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="ink-button-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建小说
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-lg text-ink-200 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          最近项目
        </h2>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-ink-600/50 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-ink-400" />
            </div>
            <h3 className="text-xl text-ink-200 mb-2">开始你的小说创作之旅</h3>
            <p className="text-ink-300 mb-6">创建一个新项目，让AI为你编织精彩故事</p>
            <button
              onClick={() => setShowModal(true)}
              className="ink-button-primary"
            >
              创建第一个小说项目
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map(project => (
                <div
                  key={project.id}
                  className="ink-card p-6 group hover:border-amber-gold/30 transition-all duration-300 cursor-pointer"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-serif text-xl text-ink-50 group-hover:text-amber-gold transition-colors">
                      {project.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-ink-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-ink-300 text-sm mb-4 line-clamp-2">
                    {project.description || '暂无描述'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-ink-400">
                    <span>创建于 {formatDate(project.createdAt)}</span>
                    <span>更新于 {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="ink-card w-full max-w-md p-6 animate-fade-in">
            <h3 className="font-serif text-xl text-ink-50 mb-6">创建新小说</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-ink-200 text-sm mb-2">小说标题</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="给小说起个名字..."
                  className="ink-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-ink-200 text-sm mb-2">简介（可选）</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="简单描述一下你的故事..."
                  className="ink-textarea"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="ink-button flex-1"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="ink-button-primary flex-1"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
