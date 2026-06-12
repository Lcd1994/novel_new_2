import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Trash2, Edit2, Check, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useProjectStore } from '@/stores/projectStore';

export default function CharacterCenter() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useProjectStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'protagonist' | 'supporting' | 'minor'>('supporting');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const projectCharacters = characters.filter(c => c.projectId === projectId);

  const handleCreate = () => {
    if (!newName.trim()) return;
    addCharacter(projectId!, newName, newRole);
    setNewName('');
    setShowCreate(false);
  };

  const handleSaveEdit = (id: string) => {
    updateCharacter(id, { name: editName });
    setEditingId(null);
  };

  const roleColors = {
    protagonist: 'bg-amber-gold/20 text-amber-gold border-amber-gold/30',
    supporting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    minor: 'bg-ink-500/50 text-ink-200 border-ink-400/30',
  };

  const roleLabels = {
    protagonist: '主角',
    supporting: '配角',
    minor: '龙套',
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="角色中心"
          showBack
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="text-ink-200">管理故事中的所有角色</p>
              <button
                onClick={() => setShowCreate(true)}
                className="ink-button-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新建角色
              </button>
            </div>

            {projectCharacters.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-ink-600/50 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
                <h3 className="text-xl text-ink-200 mb-2">还没有角色</h3>
                <p className="text-ink-300 mb-4">创建你的第一个角色开始故事</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="ink-button"
                >
                  创建角色
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectCharacters.map(char => (
                  <div key={char.id} className="ink-card p-5 group">
                    <div className="flex items-start justify-between mb-3">
                      {editingId === char.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="ink-input py-1 px-2 flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(char.id)}
                            className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-ink-50 font-serif text-lg">{char.name}</h4>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingId(char.id);
                                setEditName(char.name);
                              }}
                              className="p-1.5 rounded hover:bg-ink-500/50 text-ink-300"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteCharacter(char.id)}
                              className="p-1.5 rounded hover:bg-red-500/20 text-ink-300 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <span className={`inline-block text-xs px-2 py-1 rounded border ${roleColors[char.role]}`}>
                      {roleLabels[char.role]}
                    </span>

                    <div className="mt-4">
                      <p className="text-ink-300 text-xs mb-2">性格标签</p>
                      <div className="flex flex-wrap gap-1">
                        {char.personality.length === 0 ? (
                          <span className="text-ink-400 text-xs">待定</span>
                        ) : (
                          char.personality.map((p, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-ink-500/50 rounded text-ink-200">
                              {p.tag}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-ink-300 text-xs mb-2">当前状态</p>
                      <p className="text-ink-100 text-sm">{char.currentState}</p>
                    </div>

                    {char.growthLog.length > 0 && (
                      <div className="mt-4">
                        <p className="text-ink-300 text-xs mb-2">成长记录</p>
                        <p className="text-ink-400 text-xs">
                          {char.growthLog.length} 条记录
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="ink-card w-full max-w-md p-6 animate-fade-in">
            <h3 className="font-serif text-xl text-ink-50 mb-6">创建新角色</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-ink-200 text-sm mb-2">角色名称</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="输入角色名..."
                  className="ink-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-ink-200 text-sm mb-2">角色定位</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['protagonist', 'supporting', 'minor'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setNewRole(role)}
                      className={`p-3 rounded-lg text-sm transition-all ${
                        newRole === role
                          ? roleColors[role]
                          : 'bg-ink-600/50 text-ink-200 hover:bg-ink-600'
                      }`}
                    >
                      {roleLabels[role]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="ink-button flex-1">
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
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
