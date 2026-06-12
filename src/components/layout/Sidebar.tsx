import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Users, Globe, List, Settings, Plus, ChevronRight, MessageCircle, Home } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

export default function Sidebar() {
  const location = useLocation();
  const { currentProjectId, projects } = useProjectStore();

  const navItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: MessageCircle, label: 'AI讨论室', path: '/discussion' },
    { icon: BookOpen, label: '工作室', path: currentProjectId ? `/studio/${currentProjectId}` : '/', requiresProject: true },
    { icon: Users, label: '角色中心', path: currentProjectId ? `/characters/${currentProjectId}` : '/', requiresProject: true },
    { icon: Globe, label: '世界观', path: currentProjectId ? `/world/${currentProjectId}` : '/', requiresProject: true },
    { icon: List, label: '故事大纲', path: currentProjectId ? `/outline/${currentProjectId}` : '/', requiresProject: true },
    { icon: Settings, label: '设置', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 h-screen bg-ink-700/50 border-r border-ink-500/30 flex flex-col">
      <div className="p-6 border-b border-ink-500/30">
        <h1 className="font-serif text-2xl text-amber-gold flex items-center gap-2">
          <BookOpen className="w-7 h-7" />
          NovelForge
        </h1>
        <p className="text-ink-300 text-sm mt-1">AI小说创作引擎</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 ink-scroll">
        {navItems.map(item => {
          const Icon = item.icon;
          const disabled = item.requiresProject && !currentProjectId;

          return (
            <Link
              key={item.path}
              to={disabled ? '/' : item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
                ${isActive(item.path)
                  ? 'bg-amber-gold/20 text-amber-gold border border-amber-gold/30'
                  : 'text-ink-200 hover:bg-ink-600/50 hover:text-ink-50'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {isActive(item.path) && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {currentProjectId && (
        <div className="p-4 border-t border-ink-500/30">
          <p className="text-ink-300 text-xs mb-2">当前项目</p>
          <div className="space-y-1">
            {projects.filter(p => p.id === currentProjectId).map(p => (
              <p key={p.id} className="text-ink-50 text-sm font-medium truncate">{p.title}</p>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-ink-500/30">
        <Link
          to="/"
          className="ink-button flex items-center justify-center gap-2 w-full"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </Link>
      </div>
    </aside>
  );
}
