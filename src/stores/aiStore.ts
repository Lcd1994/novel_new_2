import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIConfig } from '@/types';

interface AIState {
  config: AIConfig;
  isGenerating: boolean;
  setConfig: (config: Partial<AIConfig>) => void;
  setGenerating: (status: boolean) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      config: {
        provider: 'deepseek',
        apiKey: '',
        baseUrl: 'https://api.deepseek.com',
      },
      isGenerating: false,

      setConfig: (config) => {
        set(state => ({
          config: { ...state.config, ...config },
        }));
      },

      setGenerating: (status) => set({ isGenerating: status }),
    }),
    {
      name: 'novelforge-ai-config',
    }
  )
);
