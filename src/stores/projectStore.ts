import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Chapter, Character, WorldSetting, Outline } from '@/types';

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
  loadChapterContent: (chapterId: string) => string;

  addCharacter: (projectId: string, name: string, role: Character['role']) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  updateWorldSetting: (projectId: string, updates: Partial<WorldSetting>) => void;

  addOutline: (projectId: string, title: string, type: Outline['type'], parentId?: string) => Outline;
  updateOutline: (id: string, updates: Partial<Outline>) => void;
  deleteOutline: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const getPreview = (content: string, maxLength: number = 100): string => {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength) + '...';
};

const countWords = (content: string): number => {
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
  const englishWords = content.match(/[a-zA-Z]+/g);
  return (chineseChars?.length || 0) + (englishWords?.length || 0);
};

const STORAGE_KEY_PREFIX = 'novelforge-chapter-content-';

const saveChapterContent = (chapterId: string, content: string) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + chapterId, content);
};

const loadChapterContent = (chapterId: string): string => {
  return localStorage.getItem(STORAGE_KEY_PREFIX + chapterId) || '';
};

const deleteChapterContent = (chapterId: string) => {
  localStorage.removeItem(STORAGE_KEY_PREFIX + chapterId);
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
        const state = get();
        const existingChapter = state.chapters.find(c => c.id === id);
        
        let newContent = updates.content;
        if (newContent !== undefined) {
          saveChapterContent(id, newContent);
        } else if (existingChapter && existingChapter.content && !state.chapters.find(c => c.id === id)?.content) {
          newContent = loadChapterContent(id);
        }

        const preview = newContent !== undefined ? getPreview(newContent) : undefined;
        const wordCount = newContent !== undefined ? countWords(newContent) : undefined;

        set(state => ({
          chapters: state.chapters.map(c =>
            c.id === id ? { 
              ...c, 
              ...updates,
              content: newContent !== undefined ? '' : c.content,
              preview: preview !== undefined ? preview : c.preview,
              wordCount: wordCount !== undefined ? wordCount : c.wordCount,
              updatedAt: Date.now() 
            } : c
          ),
        }));
      },

      deleteChapter: (id) => {
        deleteChapterContent(id);
        set(state => ({ chapters: state.chapters.filter(c => c.id !== id) }));
      },

      loadChapterContent: (chapterId): string => {
        return loadChapterContent(chapterId);
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
    }),
    {
      name: 'novelforge-storage',
    }
  )
);
