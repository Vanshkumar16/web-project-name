/**
 * useHistory Hook
 * React hook for managing history and contextual AI responses
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { HistoryStorageManager } from '../lib/historyStorageManager';
import { ContextualAIResponseGenerator } from '../lib/contextualAIResponseGenerator';
import type {
  HistoryEntry,
  HistoryContext,
  HistoryStatistics,
  AIMemory,
} from '../lib/historyTypes';

export interface UseHistoryOptions {
  autoInitialize?: boolean;
  userId?: string;
}

export function useHistory(options: UseHistoryOptions = {}) {
  const { autoInitialize = true, userId = 'default-user' } = options;

  const storageRef = useRef<HistoryStorageManager | null>(null);
  const generatorRef = useRef<ContextualAIResponseGenerator | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [recentEntries, setRecentEntries] = useState<HistoryEntry[]>([]);
  const [currentContext, setCurrentContext] = useState<HistoryContext | null>(null);
  const [statistics, setStatistics] = useState<HistoryStatistics | null>(null);
  const [aiMemory, setAIMemory] = useState<AIMemory | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    if (!autoInitialize) return;

    const initialize = async () => {
      try {
        const storage = new HistoryStorageManager(userId);
        await storage.initialize();
        storageRef.current = storage;

        const generator = new ContextualAIResponseGenerator(userId);
        await generator.initialize();
        generatorRef.current = generator;

        const memory = await storage.getAIMemory();
        setAIMemory(memory);

        const context = await storage.getHistoryContext();
        setCurrentContext(context);

        const entries = await storage.getRecentEntries(50);
        setRecentEntries(entries);

        const stats = await storage.getStatistics(30);
        setStatistics(stats);

        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        console.error('Failed to initialize history:', err);
      }
    };

    initialize();
  }, [autoInitialize, userId]);

  // Store a history entry
  const storeEntry = useCallback(
    async (entry: Omit<HistoryEntry, 'id'>) => {
      if (!storageRef.current) throw new Error('History not initialized');

      try {
        const id = await storageRef.current.storeEntry(entry);

        // Update UI
        const recent = await storageRef.current.getRecentEntries(50);
        setRecentEntries(recent);

        const context = await storageRef.current.getHistoryContext();
        setCurrentContext(context);

        return id;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        throw err;
      }
    },
    [],
  );

  // Generate contextual response
  const generateContextualResponse = useCallback(
    async (userQuery: string, baseResponse: string) => {
      if (!generatorRef.current) throw new Error('Generator not initialized');

      try {
        const response = await generatorRef.current.generateContextualResponse(
          userQuery,
          baseResponse,
        );
        return response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        throw err;
      }
    },
    [],
  );

  // Learn from feedback
  const learnFromFeedback = useCallback(
    async (query: string, response: string, rating: number, feedback?: string) => {
      if (!generatorRef.current) throw new Error('Generator not initialized');

      try {
        await generatorRef.current.learnFromFeedback(query, response, rating, feedback);

        const memory = await storageRef.current?.getAIMemory();
        setAIMemory(memory || null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        throw err;
      }
    },
    [],
  );

  // Get statistics
  const getStatistics = useCallback(async (days: number = 30) => {
    if (!storageRef.current) throw new Error('History not initialized');

    try {
      const stats = await storageRef.current.getStatistics(days);
      setStatistics(stats);
      return stats;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Get history context
  const getHistoryContext = useCallback(async () => {
    if (!storageRef.current) throw new Error('History not initialized');

    try {
      const context = await storageRef.current.getHistoryContext();
      setCurrentContext(context);
      return context;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Query entries
  const queryEntries = useCallback(
    async (query: any) => {
      if (!storageRef.current) throw new Error('History not initialized');

      try {
        return await storageRef.current.queryEntries(query);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        throw err;
      }
    },
    [],
  );

  // Export history
  const exportHistory = useCallback(
    async (format: 'json' | 'csv' | 'pdf' | 'backup' = 'json') => {
      if (!storageRef.current) throw new Error('History not initialized');

      try {
        return await storageRef.current.exportHistory(format);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        throw err;
      }
    },
    [],
  );

  // Clear history
  const clearHistory = useCallback(async () => {
    if (!storageRef.current) throw new Error('History not initialized');

    try {
      await storageRef.current.clearAllHistory();
      setRecentEntries([]);
      setStatistics(null);
      setCurrentContext(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Predict next action
  const predictNextAction = useCallback(async () => {
    if (!generatorRef.current) throw new Error('Generator not initialized');

    try {
      return await generatorRef.current.predictNextAction();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Get learnings summary
  const getLearningsSummary = useCallback(async () => {
    if (!generatorRef.current) throw new Error('Generator not initialized');

    try {
      return await generatorRef.current.getLearningsSummary();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      throw err;
    }
  }, []);

  return {
    // State
    isInitialized,
    recentEntries,
    currentContext,
    statistics,
    aiMemory,
    error,

    // Methods
    storeEntry,
    generateContextualResponse,
    learnFromFeedback,
    getStatistics,
    getHistoryContext,
    queryEntries,
    exportHistory,
    clearHistory,
    predictNextAction,
    getLearningsSummary,
  };
}
