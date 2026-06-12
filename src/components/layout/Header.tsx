import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export default function Header({ title, showBack, actions }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-ink-700/50 border-b border-ink-500/30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-ink-600/50 text-ink-200 hover:text-ink-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="font-serif text-xl text-ink-50">{title}</h2>
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
          <button className="p-2 rounded-lg hover:bg-ink-600/50 text-ink-200 hover:text-ink-50 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      )}
    </header>
  );
}
