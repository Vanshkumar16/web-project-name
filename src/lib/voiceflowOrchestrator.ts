/**
 * VoiceFlow Orchestrator
 * Main class managing the voice pipeline with tool calling
 */

import { VoicePipeline, AudioCapture, AudioPlayback, SpeechActivity, ModelManager, ModelCategory } from '@runanywhere/web';
import { VAD } from '@runanywhere/web-onnx';
import type { VoiceFlowCommand, VoiceFlowState, CommandResult } from './voiceflow.types';
import { BrowserAutomationExecutor } from './browserAutomation';
import { ToolCallingParser } from './toolCallingParser';

type VoiceFlowListener = (state: VoiceFlowState) => void;
type CommandListener = (command: VoiceFlowCommand) => void;

export class VoiceFlowOrchestrator {
  private pipeline: VoicePipeline | null = null;
  private audioCapture: AudioCapture | null = null;
  private automationExecutor = new BrowserAutomationExecutor();

  private state: VoiceFlowState = {
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    commandHistory: [],
  };

  private stateListeners: Set<VoiceFlowListener> = new Set();
  private commandListeners: Set<CommandListener> = new Set();
  private vadUnsubscribe: (() => void) | null = null;

  constructor(private systemPrompt: string = '') {
    this.systemPrompt =
      systemPrompt ||
      `You are a helpful voice assistant for browser automation. 
When users ask you to perform actions on the page, use the available tools.
Keep responses concise and friendly. Always use tool calls when appropriate.

${ToolCallingParser.generateToolSchema()}`;
  }

  /**
   * Initialize the voice flow orchestrator
   */
  async initialize(): Promise<void> {
    // Ensure all required models are loaded
    const required = [
      ModelCategory.Audio,
      ModelCategory.SpeechRecognition,
      ModelCategory.Language,
      ModelCategory.SpeechSynthesis,
    ];

    const missing = required.filter((cat) => !ModelManager.getLoadedModel(cat));

    if (missing.length > 0) {
      throw new Error(`Missing required models: ${missing.join(', ')}`);
    }

    this.pipeline = new VoicePipeline();
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    if (this.state.isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      this.state.isListening = true;
      this.notifyStateChange();

      this.audioCapture = new AudioCapture({ sampleRate: 16000 });
      VAD.reset();

      this.vadUnsubscribe = VAD.onSpeechActivity((activity) => {
        if (activity === SpeechActivity.Ended) {
          const segment = VAD.popSpeechSegment();
          if (segment && segment.samples.length > 1600) {
            // Detach listener before processing
            this.vadUnsubscribe?.();
            this.processVoiceSegment(segment.samples);
          }
        }
      });

      await this.audioCapture.start(
        (chunk) => {
          VAD.processSamples(chunk);
        },
        () => {
          // Optional: audio level callback
        },
      );
    } catch (error) {
      this.state.isListening = false;
      this.notifyStateChange();
      throw error;
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.vadUnsubscribe?.();
    this.audioCapture?.stop();
    this.state.isListening = false;
    this.notifyStateChange();
  }

  /**
   * Process a voice segment through the full pipeline
   */
  private async processVoiceSegment(audioData: Float32Array): Promise<void> {
    if (!this.pipeline) {
      throw new Error('Pipeline not initialized');
    }

    const commandId = this.generateCommandId();
    this.state.isProcessing = true;
    this.notifyStateChange();

    const command: VoiceFlowCommand = {
      id: commandId,
      timestamp: new Date(),
      transcript: '',
      response: '',
    };

    try {
      const result = await this.pipeline.processTurn(
        audioData,
        {
          maxTokens: 200,
          temperature: 0.7,
          systemPrompt: this.systemPrompt,
        },
        {
          onTranscription: (text) => {
            command.transcript = text;
            this.notifyCommandChange(command);
          },
          onResponseToken: (_token, accumulated) => {
            command.response = accumulated;
            this.notifyCommandChange(command);
          },
          onResponseComplete: (text) => {
            command.response = text;

            // Parse tool calls from response
            const intent = ToolCallingParser.extractIntent(text);
            if (intent && intent.tools.length > 0) {
              command.intent = intent;
              this.executeTools(intent.tools, command);
            }

            this.notifyCommandChange(command);
          },
          onSynthesisComplete: async (audio, sampleRate) => {
            this.state.isSpeaking = true;
            this.notifyStateChange();

            try {
              const player = new AudioPlayback({ sampleRate });
              await player.play(audio, sampleRate);
              player.dispose();
            } finally {
              this.state.isSpeaking = false;
              this.state.isProcessing = false;
              this.notifyStateChange();
            }
          },
        },
      );

      if (result) {
        command.transcript = result.transcription;
        command.response = result.response;
      }

      this.state.commandHistory.push(command);
      this.notifyCommandChange(command);
    } catch (error) {
      command.result = {
        success: false,
        message: 'Processing failed',
        error: error instanceof Error ? error.message : String(error),
      };
      this.state.commandHistory.push(command);
      this.notifyCommandChange(command);
    }

    this.state.isProcessing = false;
    this.state.isSpeaking = false;
    this.notifyStateChange();
  }

  /**
   * Execute tool calls from LLM response
   */
  private async executeTools(toolCalls: any[], command: VoiceFlowCommand): Promise<void> {
    const results: CommandResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        const result = await this.automationExecutor.executeAction({
          type: toolCall.toolName as any,
          payload: toolCall.parameters,
        });

        results.push(result);

        if (!result.success) {
          console.error(`Tool failed: ${toolCall.toolName}`, result.error);
        }
      } catch (error) {
        results.push({
          success: false,
          message: `Failed to execute ${toolCall.toolName}`,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    command.result = {
      success: results.every((r) => r.success),
      message: `Executed ${results.length} tool(s)`,
      data: { toolResults: results },
    };
  }

  /**
   * Get current state
   */
  getState(): VoiceFlowState {
    return { ...this.state };
  }

  /**
   * Get command history
   */
  getCommandHistory(): VoiceFlowCommand[] {
    return [...this.state.commandHistory];
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.state.commandHistory = [];
    this.notifyStateChange();
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: VoiceFlowListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Subscribe to command changes
   */
  onCommandChange(listener: CommandListener): () => void {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopListening();
    this.stateListeners.clear();
    this.commandListeners.clear();
  }

  private notifyStateChange(): void {
    const state = this.getState();
    this.stateListeners.forEach((listener) => listener(state));
  }

  private notifyCommandChange(command: VoiceFlowCommand): void {
    this.commandListeners.forEach((listener) => listener(command));
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
