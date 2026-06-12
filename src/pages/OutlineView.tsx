import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, ChevronRight, ChevronDown, Circle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useProjectStore } from '@/stores/projectStore';

export default function OutlineView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { outlines, addOutline, updateOutline, deleteOutline, projects } = useProjectStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'main' | 'sub'>('main');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const project = projects.find(p => p.id === projectId);
  const projectOutlines = outlines.filter(o => o.projectId === projectId);

  const mainOutlines = projectOutlines.filter(o => o.type === 'main' && !o.parentId);
  const subOutlines = projectOutlines.filter(o => o.type === 'sub');

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getChildren = (parentId: string) => {
    return projectOutlines.filter(o => o.parentId === parentId);
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    addOutline(projectId!, newTitle, newType);
    setNewTitle('');
    setShowCreate(false);
  };

  const statusColors = {
    pending: 'text-ink-400',
    in_progress: 'text-amber-gold',
    completed: 'text-green-400',
  };

  const statusLabels = {
    pending: '待写',
    in_progress: '进行中',
    completed: '已完成',
  };

  const renderOutlineItem = (outline: typeof projectOutlines[0], depth = 0) => {
    const children = getChildren(outline.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(outline.id);

    return (
      <div key={outline.id} className="animate-fade-in">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-ink-600/50 transition-colors ${
            outline.status === 'in_progress' ? 'bg-amber-gold/10 border border-amber-gold/20' : ''
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(outline.id)}
              className="p-1 text-ink-300 hover:text-ink-50"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <Circle className="w-4 h-4 text-ink-500" />
          )}

          <span className="flex-1 text-ink-100">{outline.title}</span>

          <span className={`text-xs ${statusColors[outline.status]}`}>
            {statusLabels[outline.status]}
          </span>

          <select
            value={outline.status}
            onChange={(e) => updateOutline(outline.id, { status: e.target.value as any })}
            className="bg-ink-600/50 border border-ink-400/30 rounded px-2 py-1 text-xs text-ink-200"
          >
            <option value="pending">待写</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>

          <button
            onClick={() => deleteOutline(outline.id)}
            className="p-1 text-ink-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-1">
            {children.map(child => renderOutlineItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="故事大纲"
          showBack
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="text-ink-200">规划《{project?.title || '未命名'}》的故事结构</p>
              <button
                onClick={() => setShowCreate(true)}
                className="ink-button-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加大纲节点
              </button>
            </div>

            {projectOutlines.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-ink-600/50 flex items-center justify-center">
                  <span className="text-4xl">📜</span>
                </div>
                <h3 className="text-xl text-ink-200 mb-2">还没有大纲</h3>
                <p className="text-ink-300 mb-4">创建故事大纲来规划叙事结构</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="ink-button"
                >
                  创建大纲
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="ink-card p-4">
                  <h4 className="text-amber-gold text-sm font-medium mb-3">主线剧情</h4>
                  <div className="space-y-1">
                    {mainOutlines.map(o => renderOutlineItem(o))}
                  </div>
                </div>

                {subOutlines.length > 0 && (
                  <div className="ink-card p-4">
                    <h4 className="text-blue-400 text-sm font-medium mb-3">支线剧情</h4>
                    <div className="space-y-1">
                      {subOutlines.filter(s => !s.parentId).map(o => renderOutlineItem(o))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="ink-card w-full max-w-md p-6 animate-fade-in">
            <h3 className="font-serif text-xl text-ink-50 mb-6">添加大纲节点</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-ink-200 text-sm mb-2">节点标题</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="描述这个剧情节点..."
                  className="ink-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-ink-200 text-sm mb-2">类型</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewType('main')}
                    className={`p-3 rounded-lg text-sm transition-all ${
                      newType === 'main'
                        ? 'bg-amber-gold/20 text-amber-gold border border-amber-gold/30'
                        : 'bg-ink-600/50 text-ink-200 hover:bg-ink-600'
                    }`}
                  >
                    主线
                  </button>
                  <button
                    onClick={() => setNewType('sub')}
                    className={`p-3 rounded-lg text-sm transition-all ${
                      newType === 'sub'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-ink-600/50 text-ink-200 hover:bg-ink-600'
                    }`}
                  >
                    支线
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="ink-button flex-1">
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
