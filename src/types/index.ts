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

export type AIGenerateMode = 'continue' | 'advance' | 'polish' | 'atmosphere' | 'dialogue' | 'action';

export interface GenerationParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface StoryStructureTemplate {
  id: string;
  name: string;
  description: string;
  beats: string[];
}

export const STORY_STRUCTURE_TEMPLATES: StoryStructureTemplate[] = [
  {
    id: 'hero-journey',
    name: '英雄之旅',
    description: '经典的12阶段故事结构，适合奇幻、冒险题材',
    beats: [
      '平凡世界 - 介绍主角的日常生活',
      '冒险召唤 - 主角面临一个挑战或机会',
      '拒绝召唤 - 主角因恐惧或犹豫而拒绝',
      '遇见导师 - 主角遇到提供指导和帮助的人',
      '跨越门槛 - 主角正式进入冒险世界',
      '考验、盟友、敌人 - 主角面临一系列挑战',
      '深入洞穴 - 主角接近核心冲突或宝藏',
      '苦难考验 - 主角面临最大的生死考验',
      '获得回报 - 主角克服考验获得某种奖励',
      '回归之路 - 主角带着回报踏上归途',
      '复活 - 主角在归途中再次面临考验',
      '带着灵丹妙药归来 - 主角成功归来，改变世界',
    ],
  },
  {
    id: 'three-act',
    name: '三幕结构',
    description: '经典的三幕戏剧结构，适合大多数小说类型',
    beats: [
      '第一幕 - 建置：介绍角色、背景和核心冲突',
      '激励事件 - 打破主角平衡的重大事件',
      '第一个情节转折点 - 主角做出不可逆转的选择',
      '第二幕 - 对抗：主角在新世界中面临越来越多的挑战',
      '中点 - 故事的中途转折点，提高赌注',
      '第二个情节转折点 - 主角面临看似无法克服的危机',
      '绝望低谷 - 主角失去一切，陷入最低谷',
      '第三幕 - 结局：主角依靠内在力量进行最后一搏',
      '高潮 - 主角与对手的最终对决',
      '结局 - 展示新世界的状态和角色的成长',
    ],
  },
  {
    id: 'five-act',
    name: '五幕结构',
    description: '更细腻的古典戏剧结构，适合复杂的人物关系故事',
    beats: [
      '第一幕 - 暴露：介绍角色和背景，建立核心冲突',
      '第二幕 - 上升：冲突逐渐复杂化，角色面临挑战',
      '第三幕 - 逆转：局势急剧变化，主角陷入危机',
      '第四幕 - 坠落：冲突达到顶点，主角经历最大考验',
      '第五幕 - 发现：主角获得重要领悟，做出关键决定',
      '结局：故事达到最终解决，角色获得成长',
    ],
  },
  {
    id: 'snowflake',
    name: '雪花法',
    description: '从一句话开始层层扩展的系统化创作方法',
    beats: [
      '一句话摘要 - 用一句话描述整个故事',
      '扩展为段落 - 加入背景、冲突、高潮和结局',
      '角色档案 - 为主角、配角创建详细档案',
      '扩展摘要 - 将一句话摘要扩展为一页',
      '角色关系图 - 梳理角色间的关系和互动',
      '章节大纲 - 将故事分解为章节列表',
      '章节扩展 - 为每个章节写一段描述',
      '角色故事线 - 梳理每个角色的完整故事',
      '开始写作 - 基于以上准备开始正式写作',
    ],
  },
  {
    id: 'seven-point',
    name: '七点结构',
    description: '简洁有力的故事结构，适合中篇小说',
    beats: [
      '钩子 - 在开头抓住读者',
      '第一个情节转折点 - 主角进入新世界或接受挑战',
      '第一个情节点 - 故事方向确立，赌注提高',
      '中点 - 故事的中心转折点，性质改变',
      '第二个情节点 - 看似胜利但暗藏危机',
      '危机/抉择 - 主角面临最艰难的选择',
      '高潮/结局 - 冲突的最终解决',
    ],
  },
];

export interface ExportOptions {
  format: 'txt' | 'md';
  includeChapterNumbers: boolean;
  includeChapterTitles: boolean;
}
