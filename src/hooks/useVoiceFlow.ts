/**
 * useVoiceFlow Hook
 * React hook for managing VoiceFlow state and events
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ModelCategory, ModelManager } from '@runanywhere/web';
import { VoiceFlowOrchestrator } from '../lib/voiceflowOrchestrator';
import type { VoiceFlowState, VoiceFlowCommand } from '../lib/voiceflow.types';

export interface UseVoiceFlowOptions {
  systemPrompt?: string;
  autoInitialize?: boolean;
}

export function useVoiceFlow(options: UseVoiceFlowOptions = {}) {
  const { systemPrompt = '', autoInitialize = true } = options;

  const orchestratorRef = useRef<VoiceFlowOrchestrator | null>(null);
  const [state, setState] = useState<VoiceFlowState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    commandHistory: [],
  });
  const [currentCommand, setCurrentCommand] = useState<VoiceFlowCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize orchestrator
  useEffect(() => {
    if (!autoInitialize) return;

    const initialize = async () => {
      try {
        setError(null);

        // Check required models
        const required = [
          ModelCategory.Audio,
          ModelCategory.SpeechRecognition,
          ModelCategory.Language,
          ModelCategory.SpeechSynthesis,
        ];

        const missing = required.filter((cat) => !ModelManager.getLoadedModel(cat));

        if (missing.length > 0) {
          throw new Error(
            `Missing required models: ${missing.map((m) => m.toString()).join(', ')}`,
          );
        }

        orchestratorRef.current = new VoiceFlowOrchestrator(systemPrompt);
        await orchestratorRef.current.initialize();

        // Subscribe to state changes
        orchestratorRef.current.onStateChange((newState) => {
          setState(newState);
        });

        // Subscribe to command changes
        orchestratorRef.current.onCommandChange((command) => {
          setCurrentCommand(command);
        });

        setIsInitialized(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('VoiceFlow initialization failed:', err);
      }
    };

    initialize();

    return () => {
      orchestratorRef.current?.dispose();
    };
  }, [autoInitialize, systemPrompt]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!orchestratorRef.current || !isInitialized) {
      setError('VoiceFlow not initialized');
      return;
    }

    try {
      setError(null);
      await orchestratorRef.current.startListening();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      console.error('Failed to start listening:', err);
    }
  }, [isInitialized]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!orchestratorRef.current) return;
    orchestratorRef.current.stopListening();
  }, []);

  // Get history
  const getHistory = useCallback(() => {
    if (!orchestratorRef.current) return [];
    return orchestratorRef.current.getCommandHistory();
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    if (!orchestratorRef.current) return;
    orchestratorRef.current.clearHistory();
  }, []);

  // Get current state
  const getCurrentState = useCallback(() => {
    if (!orchestratorRef.current) return state;
    return orchestratorRef.current.getState();
  }, [state]);

  return {
    state,
    currentCommand,
    error,
    isInitialized,
    isListening: state.isListening,
    isProcessing: state.isProcessing,
    isSpeaking: state.isSpeaking,
    commandHistory: state.commandHistory,
    startListening,
    stopListening,
    getHistory,
    clearHistory,
    getCurrentState,
  };
}
