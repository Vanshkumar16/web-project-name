/**
 * History Storage System
 * Tracks all user interactions and AI responses for context-aware responses
 */

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  type: 'task' | 'focus' | 'voice_command' | 'automation' | 'email' | 'calendar' | 'chat' | 'search';
  category: string;
  content: string;
  details: Record<string, any>;
  result?: string;
  duration?: number;
  success: boolean;
  tags: string[];
  metadata: {
    userInput: string;
    aiResponse?: string;
    confidence?: number;
    toolsUsed?: string[];
  };
}

export interface UserProfile {
  userId: string;
  createdAt: Date;
  preferences: {
    focusDuration: number;
    timezone: string;
    language: string;
    taskCategories: string[];
  };
  stats: {
    totalInteractions: number;
    totalTasks: number;
    totalFocusTime: number;
    averageProductivityScore: number;
    preferredTools: string[];
    peakHours: number[];
  };
}

export interface HistoryContext {
  recentActions: HistoryEntry[];
  patterns: {
    commonTasks: string[];
    commonQueries: string[];
    preferredTimes: Date[];
    frequentFails: string[];
  };
  userBehavior: {
    focusPreference: 'short' | 'medium' | 'long';
    taskStyle: 'detailed' | 'brief';
    responsePreference: 'quick' | 'comprehensive';
    automationLevel: 'manual' | 'semi-auto' | 'full-auto';
  };
}

export interface AIContextualResponse {
  response: string;
  confidence: number;
  basedOnHistory: boolean;
  historicalContext: string[];
  personalizations: string[];
  recommendations: string[];
}

/**
 * IndexedDB Schema for permanent storage
 */
export const HISTORY_DB_SCHEMA = {
  name: 'VoiceFlowHistory',
  version: 1,
  stores: {
    entries: {
      keyPath: 'id',
      indexes: {
        timestamp: 'timestamp',
        type: 'type',
        userId: 'userId',
        tags: 'tags',
        success: 'success',
      },
    },
    profiles: {
      keyPath: 'userId',
      indexes: {
        createdAt: 'createdAt',
      },
    },
    analytics: {
      keyPath: 'id',
      indexes: {
        date: 'date',
        category: 'category',
      },
    },
  },
};

/**
 * History entry types with examples
 */
export const HISTORY_TYPES = {
  task: {
    name: 'Task Management',
    icon: '📝',
    fields: ['title', 'priority', 'dueDate', 'completed'],
  },
  focus: {
    name: 'Focus Session',
    icon: '🎯',
    fields: ['duration', 'distractions', 'tasksCompleted', 'efficiency'],
  },
  voice_command: {
    name: 'Voice Command',
    icon: '🎤',
    fields: ['command', 'intent', 'toolsUsed', 'result'],
  },
  automation: {
    name: 'Browser Automation',
    icon: '🤖',
    fields: ['action', 'target', 'parameters', 'result'],
  },
  email: {
    name: 'Email',
    icon: '💌',
    fields: ['recipient', 'subject', 'timestamp', 'status'],
  },
  calendar: {
    name: 'Calendar Event',
    icon: '📅',
    fields: ['title', 'time', 'duration', 'attendees'],
  },
  chat: {
    name: 'Chat Interaction',
    icon: '💬',
    fields: ['query', 'response', 'model', 'tokens'],
  },
  search: {
    name: 'Search Query',
    icon: '🔍',
    fields: ['query', 'results', 'category', 'timestamp'],
  },
};

/**
 * Behavior patterns
 */
export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  lastOccurred: Date;
  contexts: string[];
  confidence: number;
}

export interface TimePattern {
  hour: number;
  dayOfWeek: number;
  activity: string;
  frequency: number;
  successRate: number;
}

/**
 * Historical insights
 */
export interface HistoricalInsight {
  id: string;
  type: 'pattern' | 'recommendation' | 'warning' | 'opportunity';
  title: string;
  description: string;
  evidence: HistoryEntry[];
  actionable: boolean;
  suggestedAction?: string;
  confidence: number;
}

/**
 * AI Learning from history
 */
export interface AIMemory {
  userId: string;
  lastUpdated: Date;
  learnings: {
    preferredResponseLength: 'short' | 'medium' | 'long';
    preferredFormality: 'casual' | 'professional' | 'mixed';
    commandPatterns: string[];
    frequentErrors: string[];
    successPatterns: string[];
  };
  contextualUnderstanding: {
    currentFocus: string;
    recentTasks: string[];
    upcomingDeadlines: Date[];
    commonChallenges: string[];
  };
}

/**
 * History queries
 */
export interface HistoryQuery {
  startDate?: Date;
  endDate?: Date;
  types?: string[];
  tags?: string[];
  success?: boolean;
  searchText?: string;
  limit?: number;
  offset?: number;
}

/**
 * Statistics and analytics
 */
export interface HistoryStatistics {
  totalEntries: number;
  entriesByType: Record<string, number>;
  successRate: number;
  averageResponseTime: number;
  commonTags: string[];
  timeDistribution: Record<number, number>;
  activityTrend: Array<{ date: Date; count: number }>;
  topPatterns: BehaviorPattern[];
  insights: HistoricalInsight[];
}

/**
 * Export formats
 */
export type ExportFormat = 'json' | 'csv' | 'pdf' | 'backup';

export interface ExportData {
  format: ExportFormat;
  timestamp: Date;
  entries: HistoryEntry[];
  profile: UserProfile;
  statistics: HistoryStatistics;
  metadata: {
    version: string;
    totalSize: number;
    encrypted: boolean;
  };
}
