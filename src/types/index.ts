export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorldSetting {
  id: string;
  projectId: string;
  era: string;
  location: string;
  societyRules: string;
  customRules: string[];
}

export interface PersonalityTag {
  tag: string;
  weight: number;
  evolvedAt?: number;
}

export interface CharacterRelation {
  targetId: string;
  targetName: string;
  type: 'friend' | 'enemy' | 'neutral' | 'romantic';
  intimacy: number;
}

export interface GrowthEvent {
  chapterId: string;
  description: string;
  personalityChanges: Partial<PersonalityTag>[];
  timestamp: number;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: 'protagonist' | 'supporting' | 'minor';
  avatar?: string;
  personality: PersonalityTag[];
  relationships: CharacterRelation[];
  growthLog: GrowthEvent[];
  currentState: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  number: number;
  title: string;
  content: string;
  preview: string;
  wordCount: number;
  status: 'draft' | 'ai_generated' | 'revised' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface Outline {
  id: string;
  projectId: string;
  title: string;
  type: 'main' | 'sub';
  parentId?: string;
  status: 'pending' | 'in_progress' | 'completed';
  description: string;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export type AIGenerateMode = 'continue' | 'advance' | 'polish' | 'atmosphere';
