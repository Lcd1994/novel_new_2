import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useProjectStore } from '@/stores/projectStore';

export default function Reader() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { chapters, projects, getChapterContent } = useProjectStore();

  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'dark' | 'sepia'>('dark');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const project = projects.find(p => p.id === projectId);
  const projectChapters = chapters.filter(c => c.projectId === projectId).sort((a, b) => a.number - b.number);
  const currentChapter = projectChapters.find(c => c.id === chapterId);
  const currentIndex = projectChapters.findIndex(c => c.id === chapterId);

  const prevChapter = currentIndex > 0 ? projectChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < projectChapters.length - 1 ? projectChapters[currentIndex + 1] : null;

  useEffect(() => {
    if (chapterId) {
      setContent(getChapterContent(chapterId));
    }
  }, [chapterId, getChapterContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prevChapter) {
        navigate(`/reader/${projectId}/${prevChapter.id}`);
      } else if (e.key === 'ArrowRight' && nextChapter) {
        navigate(`/reader/${projectId}/${nextChapter.id}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevChapter, nextChapter, navigate, projectId]);

  const bgColors = {
    dark: 'bg-ink-700',
    sepia: 'bg-amber-50',
  };

  const textColors = {
    dark: 'text-ink-100',
    sepia: 'text-stone-800',
  };

  return (
    <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]}`}>
      <header className={`border-b ${theme === 'dark' ? 'border-ink-500/30 bg-ink-700/50' : 'border-amber-200 bg-amber-100/50'}`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/studio/${projectId}`)}
            className={`flex items-center gap-2 ${theme === 'dark' ? 'text-ink-200 hover:text-ink-50' : 'text-stone-600 hover:text-stone-800'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            返回工作室
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${theme === 'dark' ? 'text-ink-300' : 'text-stone-500'}`}>字号</span>
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-ink-600' : 'hover:bg-amber-200'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-ink-600' : 'hover:bg-amber-200'}`}
              >
                A+
              </button>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'sepia' : 'dark')}
              className={`px-3 py-1 rounded text-sm ${theme === 'dark' ? 'bg-ink-600 text-ink-200' : 'bg-amber-200 text-stone-700'}`}
            >
              {theme === 'dark' ? '护眼模式' : '夜间模式'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {currentChapter ? (
          <article className="animate-fade-in">
            <h1 className={`font-serif text-3xl mb-8 ${theme === 'dark' ? 'text-amber-gold' : 'text-amber-800'}`}>
              {currentChapter.title}
            </h1>

            <div
              className="leading-loose whitespace-pre-wrap text-ink-100"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
            >
              {content || '暂无内容'}
            </div>

            <div className="mt-16 pt-8 border-t border-ink-500/30 flex items-center justify-between">
              {prevChapter ? (
                <button
                  onClick={() => navigate(`/reader/${projectId}/${prevChapter.id}`)}
                  className={`flex items-center gap-2 ${theme === 'dark' ? 'text-ink-300 hover:text-ink-100' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {prevChapter.title}
                </button>
              ) : (
                <div />
              )}

              <span className={`text-sm ${theme === 'dark' ? 'text-ink-400' : 'text-stone-400'}`}>
                {currentIndex + 1} / {projectChapters.length}
              </span>

              {nextChapter ? (
                <button
                  onClick={() => navigate(`/reader/${projectId}/${nextChapter.id}`)}
                  className={`flex items-center gap-2 ${theme === 'dark' ? 'text-ink-300 hover:text-ink-100' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  {nextChapter.title}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </article>
        ) : (
          <div className="text-center py-20">
            <BookOpen className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-ink-400' : 'text-stone-400'}`} />
            <p className={theme === 'dark' ? 'text-ink-200' : 'text-stone-600'}>章节不存在</p>
            <button
              onClick={() => navigate(`/studio/${projectId}`)}
              className="ink-button mt-4"
            >
              返回工作室
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
