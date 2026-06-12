import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Chapter, Character, WorldSetting, Outline, ExportOptions } from '@/types';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  chapters: Chapter[];
  characters: Character[];
  worldSettings: WorldSetting[];
  outlines: Outline[];

  createProject: (title: string, description: string) => Project;
  setCurrentProject: (id: string | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addChapter: (projectId: string, title: string) => Chapter;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
  getChapterContent: (chapterId: string) => string;
  updateChapterContent: (chapterId: string, content: string) => void;

  addCharacter: (projectId: string, name: string, role: Character['role']) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  updateWorldSetting: (projectId: string, updates: Partial<WorldSetting>) => void;

  addOutline: (projectId: string, title: string, type: Outline['type'], parentId?: string) => Outline;
  updateOutline: (id: string, updates: Partial<Outline>) => void;
  deleteOutline: (id: string) => void;

  exportProject: (projectId: string, options: ExportOptions) => string;
  getProjectStats: (projectId: string) => { chapterCount: number; totalWords: number; charCount: number };
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const getPreview = (content: string, maxLength: number = 100): string => {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength) + '...';
};

const countWords = (content: string): number => {
  if (!content || !content.trim()) return 0;
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
  const englishWords = content.match(/[a-zA-Z]+/g);
  return (chineseChars?.length || 0) + (englishWords?.length || 0);
};

const STORAGE_KEY_PREFIX = 'novelforge-chapter-content-';

const saveChapterContent = (chapterId: string, content: string) => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + chapterId, content);
  } catch (e) {
    console.warn('保存章节内容失败:', e);
  }
};

const loadChapterContent = (chapterId: string): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + chapterId) || '';
  } catch (e) {
    console.warn('读取章节内容失败:', e);
    return '';
  }
};

const deleteChapterContent = (chapterId: string) => {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + chapterId);
  } catch (e) {
    console.warn('删除章节内容失败:', e);
  }
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      chapters: [],
      characters: [],
      worldSettings: [],
      outlines: [],

      createProject: (title, description) => {
        const project: Project = {
          id: generateId(),
          title,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set(state => ({ projects: [...state.projects, project] }));
        return project;
      },

      setCurrentProject: (id) => set({ currentProjectId: id }),

      updateProject: (id, updates) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },

      deleteProject: (id) => {
        const chaptersToDelete = get().chapters.filter(c => c.projectId === id);
        chaptersToDelete.forEach(chapter => deleteChapterContent(chapter.id));

        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          chapters: state.chapters.filter(c => c.projectId !== id),
          characters: state.characters.filter(c => c.projectId !== id),
          worldSettings: state.worldSettings.filter(w => w.projectId !== id),
          outlines: state.outlines.filter(o => o.projectId !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
        }));
      },

      addChapter: (projectId, title) => {
        const chapters = get().chapters.filter(c => c.projectId === projectId);
        const chapter: Chapter = {
          id: generateId(),
          projectId,
          number: chapters.length + 1,
          title,
          content: '',
          preview: '',
          wordCount: 0,
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set(state => ({ chapters: [...state.chapters, chapter] }));
        return chapter;
      },

      updateChapter: (id, updates) => {
        const hasContentUpdate = updates.content !== undefined;
        const newContent = updates.content;
        const newPreview = hasContentUpdate ? getPreview(newContent || '') : undefined;
        const newWordCount = hasContentUpdate ? countWords(newContent || '') : undefined;

        if (hasContentUpdate && newContent !== undefined) {
          saveChapterContent(id, newContent);
        }

        set(state => ({
          chapters: state.chapters.map(c =>
            c.id === id ? {
              ...c,
              ...updates,
              content: '',
              preview: newPreview !== undefined ? newPreview : c.preview,
              wordCount: newWordCount !== undefined ? newWordCount : c.wordCount,
              updatedAt: Date.now()
            } : c
          ),
        }));
      },

      deleteChapter: (id) => {
        deleteChapterContent(id);
        set(state => ({ chapters: state.chapters.filter(c => c.id !== id) }));
      },

      getChapterContent: (chapterId): string => {
        return loadChapterContent(chapterId);
      },

      updateChapterContent: (chapterId, content) => {
        saveChapterContent(chapterId, content);
        const preview = getPreview(content);
        const wordCount = countWords(content);

        set(state => ({
          chapters: state.chapters.map(c =>
            c.id === chapterId ? { ...c, preview, wordCount, content: '', updatedAt: Date.now() } : c
          ),
        }));
      },

      addCharacter: (projectId, name, role) => {
        const character: Character = {
          id: generateId(),
          projectId,
          name,
          role,
          personality: [],
          relationships: [],
          growthLog: [],
          currentState: '待登场',
        };
        set(state => ({ characters: [...state.characters, character] }));
        return character;
      },

      updateCharacter: (id, updates) => {
        set(state => ({
          characters: state.characters.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCharacter: (id) => {
        set(state => ({ characters: state.characters.filter(c => c.id !== id) }));
      },

      updateWorldSetting: (projectId, updates) => {
        const existing = get().worldSettings.find(w => w.projectId === projectId);
        if (existing) {
          set(state => ({
            worldSettings: state.worldSettings.map(w =>
              w.projectId === projectId ? { ...w, ...updates } : w
            ),
          }));
        } else {
          const newSetting: WorldSetting = {
            id: generateId(),
            projectId,
            era: '',
            location: '',
            societyRules: '',
            customRules: [],
            ...updates,
          };
          set(state => ({ worldSettings: [...state.worldSettings, newSetting] }));
        }
      },

      addOutline: (projectId, title, type, parentId) => {
        const outline: Outline = {
          id: generateId(),
          projectId,
          title,
          type,
          parentId,
          status: 'pending',
          description: '',
        };
        set(state => ({ outlines: [...state.outlines, outline] }));
        return outline;
      },

      updateOutline: (id, updates) => {
        set(state => ({
          outlines: state.outlines.map(o =>
            o.id === id ? { ...o, ...updates } : o
          ),
        }));
      },

      deleteOutline: (id) => {
        set(state => ({ outlines: state.outlines.filter(o => o.id !== id) }));
      },

      exportProject: (projectId, options): string => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return '';

        const projectChapters = state.chapters
          .filter(c => c.projectId === projectId)
          .sort((a, b) => a.number - b.number);

        let output = '';

        if (options.format === 'md') {
          output += `# ${project.title}\n\n`;
          if (project.description) {
            output += `> ${project.description}\n\n`;
          }
          output += `---\n\n`;

          for (const chapter of projectChapters) {
            const content = loadChapterContent(chapter.id);
            if (!content.trim()) continue;

            let heading = '';
            if (options.includeChapterNumbers) {
              heading += `第 ${chapter.number} 章`;
            }
            if (options.includeChapterTitles) {
              heading += heading ? `：${chapter.title}` : chapter.title;
            }
            if (heading) {
              output += `## ${heading}\n\n`;
            }

            output += `${content}\n\n`;
            output += `---\n\n`;
          }
        } else {
          // txt format
          output += `${project.title}\n`;
          if (project.description) {
            output += `${project.description}\n`;
          }
          output += `${'='.repeat(40)}\n\n`;

          for (const chapter of projectChapters) {
            const content = loadChapterContent(chapter.id);
            if (!content.trim()) continue;

            let heading = '';
            if (options.includeChapterNumbers) {
              heading += `第 ${chapter.number} 章`;
            }
            if (options.includeChapterTitles) {
              heading += heading ? `：${chapter.title}` : chapter.title;
            }
            if (heading) {
              output += `${heading}\n`;
              output += `${'-'.repeat(20)}\n`;
            }

            output += `${content}\n\n`;
          }
        }

        return output.trim();
      },

      getProjectStats: (projectId) => {
        const state = get();
        const projectChapters = state.chapters.filter(c => c.projectId === projectId);

        let totalWords = 0;
        for (const chapter of projectChapters) {
          const content = loadChapterContent(chapter.id);
          totalWords += countWords(content);
        }

        const charCount = state.characters.filter(c => c.projectId === projectId).length;

        return {
          chapterCount: projectChapters.length,
          totalWords,
          charCount,
        };
      },
    }),
    {
      name: 'novelforge-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        chapters: state.chapters,
        characters: state.characters,
        worldSettings: state.worldSettings,
        outlines: state.outlines,
      }),
    }
  )
);
