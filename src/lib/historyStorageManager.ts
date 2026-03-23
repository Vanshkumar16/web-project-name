/**
 * History Storage Manager
 * Manages persistent storage and retrieval of user interaction history
 */

import type {
  HistoryEntry,
  UserProfile,
  HistoryContext,
  HistoryQuery,
  HistoryStatistics,
  ExportFormat,
  ExportData,
  AIMemory,
} from './historyTypes';

export class HistoryStorageManager {
  private db: IDBDatabase | null = null;
  private userId: string;
  private dbName = 'VoiceFlowHistory';
  private dbVersion = 1;

  constructor(userId: string = 'default-user') {
    this.userId = userId;
  }

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('entries')) {
          const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });
          entriesStore.createIndex('timestamp', 'timestamp');
          entriesStore.createIndex('type', 'type');
          entriesStore.createIndex('userId', 'userId');
          entriesStore.createIndex('tags', 'tags', { multiEntry: true });
          entriesStore.createIndex('success', 'success');
        }

        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'userId' });
        }

        if (!db.objectStoreNames.contains('aiMemory')) {
          db.createObjectStore('aiMemory', { keyPath: 'userId' });
        }

        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
          analyticsStore.createIndex('date', 'date');
          analyticsStore.createIndex('category', 'category');
        }
      };
    });
  }

  /**
   * Store a history entry
   */
  async storeEntry(entry: Omit<HistoryEntry, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const fullEntry: HistoryEntry = {
      id: `${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entry,
      timestamp: new Date(entry.timestamp),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.add(fullEntry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(fullEntry.id);
    });
  }

  /**
   * Get entry by ID
   */
  async getEntry(id: string): Promise<HistoryEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Query entries with filters
   */
  async queryEntries(query: HistoryQuery): Promise<HistoryEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const allEntries: HistoryEntry[] = [];

      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let filtered = request.result as HistoryEntry[];

        // Apply filters
        if (query.startDate) {
          filtered = filtered.filter((e) => e.timestamp >= query.startDate!);
        }
        if (query.endDate) {
          filtered = filtered.filter((e) => e.timestamp <= query.endDate!);
        }
        if (query.types && query.types.length > 0) {
          filtered = filtered.filter((e) => query.types!.includes(e.type));
        }
        if (query.tags && query.tags.length > 0) {
          filtered = filtered.filter((e) =>
            query.tags!.some((tag) => e.tags.includes(tag)),
          );
        }
        if (query.success !== undefined) {
          filtered = filtered.filter((e) => e.success === query.success);
        }
        if (query.searchText) {
          const text = query.searchText.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.content.toLowerCase().includes(text) ||
              e.category.toLowerCase().includes(text),
          );
        }

        // Sort by timestamp descending
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Apply limit and offset
        if (query.offset) {
          filtered = filtered.slice(query.offset);
        }
        if (query.limit) {
          filtered = filtered.slice(0, query.limit);
        }

        resolve(filtered);
      };
    });
  }

  /**
   * Get recent entries
   */
  async getRecentEntries(limit: number = 50): Promise<HistoryEntry[]> {
    return this.queryEntries({ limit });
  }

  /**
   * Get entries by type
   */
  async getEntriesByType(type: string, limit: number = 50): Promise<HistoryEntry[]> {
    return this.queryEntries({ types: [type], limit });
  }

  /**
   * Get context from history for AI responses
   */
  async getHistoryContext(): Promise<HistoryContext> {
    const recentEntries = await this.getRecentEntries(100);

    // Extract patterns
    const commonTasks: Record<string, number> = {};
    const commonQueries: Record<string, number> = {};
    const toolsUsed: Record<string, number> = {};
    const timeDistribution: Record<number, number> = {};
    const failureReasons: string[] = [];

    recentEntries.forEach((entry) => {
      const hour = new Date(entry.timestamp).getHours();
      timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;

      if (entry.type === 'task') {
        const title = entry.metadata.userInput;
        commonTasks[title] = (commonTasks[title] || 0) + 1;
      }

      if (entry.type === 'voice_command') {
        commonQueries[entry.metadata.userInput] = (commonQueries[entry.metadata.userInput] || 0) + 1;
      }

      if (entry.metadata.toolsUsed) {
        entry.metadata.toolsUsed.forEach((tool: string) => {
          toolsUsed[tool] = (toolsUsed[tool] || 0) + 1;
        });
      }

      if (!entry.success && entry.metadata.userInput) {
        failureReasons.push(entry.metadata.userInput);
      }
    });

    const peakHours = Object.entries(timeDistribution)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .filter((h) => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((h) => h.hour);

    // Determine behavior patterns
    const focusEntries = recentEntries.filter((e) => e.type === 'focus');
    const avgFocusDuration =
      focusEntries.length > 0
        ? focusEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / focusEntries.length
        : 25;

    const focusPreference =
      avgFocusDuration < 30 ? 'short' : avgFocusDuration < 60 ? 'medium' : 'long';

    const successRate =
      recentEntries.length > 0
        ? recentEntries.filter((e) => e.success).length / recentEntries.length
        : 0.5;

    return {
      recentActions: recentEntries.slice(0, 20),
      patterns: {
        commonTasks: Object.entries(commonTasks)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map((e) => e[0]),
        commonQueries: Object.entries(commonQueries)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map((e) => e[0]),
        preferredTimes: peakHours.map((h) => {
          const d = new Date();
          d.setHours(h);
          return d;
        }),
        frequentFails: [...new Set(failureReasons)].slice(0, 5),
      },
      userBehavior: {
        focusPreference,
        taskStyle: recentEntries.some((e) => e.content.length > 100) ? 'detailed' : 'brief',
        responsePreference: recentEntries.filter((e) => !e.success).length / recentEntries.length > 0.3
          ? 'comprehensive'
          : 'quick',
        automationLevel: toolsUsed['automation'] ? 'full-auto' : 'manual',
      },
    };
  }

  /**
   * Calculate statistics
   */
  async getStatistics(days: number = 30): Promise<HistoryStatistics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await this.queryEntries({
      startDate,
      limit: 10000,
    });

    const entriesByType: Record<string, number> = {};
    let successCount = 0;
    let totalDuration = 0;
    const tags: Record<string, number> = {};
    const timeDistribution: Record<string, number> = {};

    entries.forEach((entry) => {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
      if (entry.success) successCount++;
      if (entry.duration) totalDuration += entry.duration;

      entry.tags.forEach((tag) => {
        tags[tag] = (tags[tag] || 0) + 1;
      });

      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      const dateKey = date || 'unknown';
      timeDistribution[dateKey] = (timeDistribution[dateKey] || 0) + 1;
    });

    const context = await this.getHistoryContext();

    return {
      totalEntries: entries.length,
      entriesByType,
      successRate: entries.length > 0 ? successCount / entries.length : 0,
      averageResponseTime: entries.length > 0 ? totalDuration / entries.length : 0,
      commonTags: Object.entries(tags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map((e) => e[0]),
      timeDistribution: Object.fromEntries(
        Object.entries(timeDistribution).slice(-7),
      ) as Record<number, number>,
      activityTrend: Object.entries(timeDistribution)
        .map(([date, count]) => ({
          date: new Date(date),
          count,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
      topPatterns: [],
      insights: [],
    };
  }

  /**
   * Store user profile
   */
  async storeProfile(profile: UserProfile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['profiles'], 'readwrite');
      const store = transaction.objectStore('profiles');
      const request = store.put(profile);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<UserProfile | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['profiles'], 'readonly');
      const store = transaction.objectStore('profiles');
      const request = store.get(this.userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Store AI memory
   */
  async storeAIMemory(memory: AIMemory): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['aiMemory'], 'readwrite');
      const store = transaction.objectStore('aiMemory');
      const request = store.put(memory);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get AI memory
   */
  async getAIMemory(): Promise<AIMemory | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['aiMemory'], 'readonly');
      const store = transaction.objectStore('aiMemory');
      const request = store.get(this.userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Export history
   */
  async exportHistory(format: ExportFormat = 'json'): Promise<ExportData> {
    const entries = await this.queryEntries({ limit: 100000 });
    const profile = await this.getProfile();
    const stats = await this.getStatistics();

    return {
      format,
      timestamp: new Date(),
      entries,
      profile: profile || {
        userId: this.userId,
        createdAt: new Date(),
        preferences: {
          focusDuration: 25,
          timezone: 'UTC',
          language: 'en',
          taskCategories: [],
        },
        stats: {
          totalInteractions: entries.length,
          totalTasks: 0,
          totalFocusTime: 0,
          averageProductivityScore: 0,
          preferredTools: [],
          peakHours: [],
        },
      },
      statistics: stats,
      metadata: {
        version: '1.0.0',
        totalSize: JSON.stringify(entries).length,
        encrypted: false,
      },
    };
  }

  /**
   * Clear all history
   */
  async clearAllHistory(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries', 'profiles', 'aiMemory', 'analytics'], 'readwrite');

      const requests = [
        transaction.objectStore('entries').clear(),
        transaction.objectStore('profiles').clear(),
        transaction.objectStore('aiMemory').clear(),
        transaction.objectStore('analytics').clear(),
      ];

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  /**
   * Get database size info
   */
  async getStorageInfo(): Promise<{ used: number; quota: number; percentage: number }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { used: 0, quota: 0, percentage: 0 };
    }

    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.usage && estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0,
    };
  }
}
