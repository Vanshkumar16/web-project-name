/**
 * VoiceFlowTab Component
 * Main UI for the VoiceFlow voice-controlled browser automation tool
 */

import { useState, useEffect } from 'react';
import { useVoiceFlow } from '../hooks/useVoiceFlow';
import { ModelBanner } from './ModelBanner';
import { ModelCategory } from '@runanywhere/web';
import { useModelLoader } from '../hooks/useModelLoader';
import type { VoiceFlowCommand } from '../lib/voiceflow.types';
import '../styles/voiceflow.css';

export function VoiceFlowTab() {
  const llmLoader = useModelLoader(ModelCategory.Language, true);
  const sttLoader = useModelLoader(ModelCategory.SpeechRecognition, true);
  const ttsLoader = useModelLoader(ModelCategory.SpeechSynthesis, true);
  const vadLoader = useModelLoader(ModelCategory.Audio, true);

  const voiceFlow = useVoiceFlow({
    autoInitialize: true,
    systemPrompt: `You are a helpful voice assistant for browser automation and productivity.
When users ask you to perform actions on the page, analyze their request and use the available tools.
Keep responses concise and friendly.

BROWSER AUTOMATION TOOLS:
- fillForm: Fill out a form with provided values and optionally submit it
- navigate: Navigate to a URL and optionally wait for an element
- extractData: Extract data from the page using a selector
- click: Click an element on the page
- screenshot: Take a screenshot of the page or an element
- wait: Wait for a specified duration

PRODUCTIVITY TOOLS (mention when appropriate):
- createTask: Create tasks with priority (low/medium/high/urgent)
- completeTask: Mark tasks as complete
- listTasks: Show pending tasks
- startTimer: Start a timer for focused work (Pomodoro: 25/50/90 min)
- startFocusMode: Enable distraction-free mode
- scheduleEmail: Schedule emails for later
- takeNote: Quick voice note capture
- checkCalendar: Check calendar availability
- getProductivityMetrics: Show productivity statistics

When you need to use a tool, output it in this format:
<tool_call>
  <name>toolName</name>
  <parameters>
    <key>value</key>
  </parameters>
</tool_call>

Always suggest using focus mode for important tasks and track productivity metrics.`,
  });

  const [showHistory, setShowHistory] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Simulate audio level animation
  useEffect(() => {
    if (!voiceFlow.isListening) return;

    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);

    return () => clearInterval(interval);
  }, [voiceFlow.isListening]);

  // Check for pending models
  const pendingLoaders = [
    { label: 'VAD', loader: vadLoader },
    { label: 'STT', loader: sttLoader },
    { label: 'LLM', loader: llmLoader },
    { label: 'TTS', loader: ttsLoader },
  ].filter((l) => l.loader.state !== 'ready');

  const ensureModels = async () => {
    const results = await Promise.all([
      vadLoader.ensure(),
      sttLoader.ensure(),
      llmLoader.ensure(),
      ttsLoader.ensure(),
    ]);
    return results.every(Boolean);
  };

  return (
    <div className="tab-panel voiceflow-panel">
      {pendingLoaders.length > 0 && !voiceFlow.isInitialized && (
        <ModelBanner
          state={pendingLoaders[0].loader.state}
          progress={pendingLoaders[0].loader.progress}
          error={pendingLoaders[0].loader.error}
          onLoad={ensureModels}
          label={`VoiceFlow (${pendingLoaders.map((l) => l.label).join(', ')})`}
        />
      )}

      {voiceFlow.error && <div className="voiceflow-error">{voiceFlow.error}</div>}

      {/* Main Voice Control */}
      <div className="voiceflow-main">
        <div className="voiceflow-orb" data-state={voiceFlow.isProcessing ? 'processing' : voiceFlow.isListening ? 'listening' : voiceFlow.isSpeaking ? 'speaking' : 'idle'}>
          <div className="voiceflow-orb-inner" style={{ opacity: 0.3 + (audioLevel / 100) * 0.7 }} />
          <div className="voiceflow-orb-ring" />
        </div>

        <p className="voiceflow-status">
          {!voiceFlow.isInitialized && 'Initializing VoiceFlow...'}
          {voiceFlow.isInitialized && voiceFlow.isListening && 'Listening... speak now'}
          {voiceFlow.isInitialized && voiceFlow.isProcessing && !voiceFlow.isListening && 'Processing your command...'}
          {voiceFlow.isInitialized && voiceFlow.isSpeaking && 'Speaking response...'}
          {voiceFlow.isInitialized && !voiceFlow.isListening && !voiceFlow.isProcessing && !voiceFlow.isSpeaking && 'Tap to start voice control'}
        </p>

        {voiceFlow.isInitialized && (
          <div className="voiceflow-controls">
            {!voiceFlow.isListening ? (
              <button className="btn btn-primary btn-lg" onClick={voiceFlow.startListening} disabled={voiceFlow.isProcessing || voiceFlow.isSpeaking}>
                🎤 Start Listening
              </button>
            ) : (
              <button className="btn btn-lg btn-danger" onClick={voiceFlow.stopListening}>
                ⏹ Stop
              </button>
            )}
          </div>
        )}
      </div>

      {/* Current Command Display */}
      {voiceFlow.currentCommand && (
        <div className="voiceflow-current">
          {voiceFlow.currentCommand.transcript && (
            <div className="voiceflow-section">
              <h4>📝 You said:</h4>
              <p className="voiceflow-transcript">{voiceFlow.currentCommand.transcript}</p>
            </div>
          )}

          {voiceFlow.currentCommand.intent && (
            <div className="voiceflow-section">
              <h4>🛠 Intent:</h4>
              <p className="voiceflow-intent">{voiceFlow.currentCommand.intent.description}</p>
              {voiceFlow.currentCommand.intent.tools.length > 0 && (
                <div className="voiceflow-tools">
                  {voiceFlow.currentCommand.intent.tools.map((tool, i) => (
                    <div key={i} className="voiceflow-tool">
                      <span className="tool-name">{tool.toolName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {voiceFlow.currentCommand.response && (
            <div className="voiceflow-section">
              <h4>💬 AI Response:</h4>
              <p className="voiceflow-response">{voiceFlow.currentCommand.response}</p>
            </div>
          )}

          {voiceFlow.currentCommand.result && (
            <div className={`voiceflow-section result ${voiceFlow.currentCommand.result.success ? 'success' : 'error'}`}>
              <h4>{voiceFlow.currentCommand.result.success ? '✅ Success' : '❌ Error'}</h4>
              <p>{voiceFlow.currentCommand.result.message}</p>
              {voiceFlow.currentCommand.result.error && <p className="error-detail">{voiceFlow.currentCommand.result.error}</p>}
            </div>
          )}
        </div>
      )}

      {/* Command History */}
      <div className="voiceflow-history-section">
        <button className="btn btn-sm" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? '▼ Hide' : '▶ Show'} History ({voiceFlow.commandHistory.length})
        </button>

        {showHistory && voiceFlow.commandHistory.length > 0 && (
          <div className="voiceflow-history-list">
            {voiceFlow.commandHistory.slice().reverse().map((cmd) => (
              <CommandHistoryItem key={cmd.id} command={cmd} />
            ))}
          </div>
        )}

        {voiceFlow.commandHistory.length > 0 && (
          <button className="btn btn-sm btn-outline" onClick={voiceFlow.clearHistory}>
            Clear History
          </button>
        )}
      </div>
    </div>
  );
}

function CommandHistoryItem({ command }: { command: VoiceFlowCommand }) {
  return (
    <div className="voiceflow-history-item">
      <div className="history-header">
        <span className="history-time">{new Date(command.timestamp).toLocaleTimeString()}</span>
        <span className={`history-status ${command.result?.success ? 'success' : command.result ? 'error' : 'pending'}`}>
          {command.result?.success ? '✅' : command.result ? '❌' : '⏳'}
        </span>
      </div>
      <div className="history-content">
        <p className="history-transcript">
          <strong>You:</strong> {command.transcript || '(no transcript)'}
        </p>
        {command.intent && (
          <p className="history-intent">
            <strong>Intent:</strong> {command.intent.description}
          </p>
        )}
        <p className="history-response">
          <strong>Response:</strong> {command.response?.substring(0, 100) || '(no response)'}
          {(command.response?.length || 0) > 100 && '...'}
        </p>
      </div>
    </div>
  );
}
