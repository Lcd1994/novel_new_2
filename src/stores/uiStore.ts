import { create } from 'zustand';

interface UIState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  currentView: 'edit' | 'preview';
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setCurrentView: (view: 'edit' | 'preview') => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  currentView: 'edit',

  toggleLeftPanel: () => set(state => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () => set(state => ({ rightPanelOpen: !state.rightPanelOpen })),
  setCurrentView: (view) => set({ currentView: view }),
}));
