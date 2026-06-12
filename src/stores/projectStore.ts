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

  addCharacter: (projectId: string, name: string, role: Character['role']) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  updateWorldSetting: (projectId: string, updates: Partial<WorldSetting>) => void;

  addOutline: (projectId: string, title: string, type: Outline['type'], parentId?: string) => Outline;
  updateOutline: (id: string, updates: Partial<Outline>) => void;
  deleteOutline: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

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
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set(state => ({ chapters: [...state.chapters, chapter] }));
        return chapter;
      },

      updateChapter: (id, updates) => {
        set(state => ({
          chapters: state.chapters.map(c =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
        }));
      },

      deleteChapter: (id) => {
        set(state => ({ chapters: state.chapters.filter(c => c.id !== id) }));
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
