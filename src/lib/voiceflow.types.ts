/**
 * VoiceFlow Type Definitions
 * Core types for the voice-controlled browser automation tool
 */

export interface BrowserAutomationTool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
}

export interface ToolCall {
  toolName: string;
  parameters: Record<string, unknown>;
}

export interface CommandIntent {
  description: string;
  tools: ToolCall[];
  confidence: number;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface VoiceFlowCommand {
  id: string;
  timestamp: Date;
  transcript: string;
  intent?: CommandIntent;
  result?: CommandResult;
  response: string;
}

export interface VoiceFlowState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentCommand?: VoiceFlowCommand;
  commandHistory: VoiceFlowCommand[];
}

export interface BrowserAutomationAction {
  type: 'fillForm' | 'navigate' | 'extractData' | 'screenshot' | 'click' | 'wait';
  payload: unknown;
}

export interface FormFillPayload {
  selectors: Record<string, string>; // fieldName -> CSS selector
  values: Record<string, string>;    // fieldName -> value
  submitSelector?: string;
}

export interface ExtractDataPayload {
  selector: string;
  property: 'text' | 'html' | 'value';
}

export interface NavigatePayload {
  url: string;
  waitSelector?: string;
  timeout?: number;
}

export interface ClickPayload {
  selector: string;
}

export interface WaitPayload {
  milliseconds: number;
}

export interface ScreenshotPayload {
  selector?: string;
}

// Tool definitions
export const BROWSER_AUTOMATION_TOOLS: Record<string, BrowserAutomationTool> = {
  fillForm: {
    name: 'fillForm',
    description: 'Fill out a form with provided values and optionally submit it',
    parameters: {
      selectors: {
        type: 'array',
        description: 'Map of field names to CSS selectors',
        required: true,
      },
      values: {
        type: 'array',
        description: 'Map of field names to values to fill',
        required: true,
      },
      submitSelector: {
        type: 'string',
        description: 'Optional CSS selector for submit button',
      },
    },
  },
  navigate: {
    name: 'navigate',
    description: 'Navigate to a URL and optionally wait for an element',
    parameters: {
      url: {
        type: 'string',
        description: 'URL to navigate to',
        required: true,
      },
      waitSelector: {
        type: 'string',
        description: 'Optional CSS selector to wait for',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds',
      },
    },
  },
  extractData: {
    name: 'extractData',
    description: 'Extract data from the page using a selector',
    parameters: {
      selector: {
        type: 'string',
        description: 'CSS selector for the element to extract',
        required: true,
      },
      property: {
        type: 'string',
        description: 'Property to extract: text, html, or value',
        required: true,
      },
    },
  },
  click: {
    name: 'click',
    description: 'Click an element on the page',
    parameters: {
      selector: {
        type: 'string',
        description: 'CSS selector for the element to click',
        required: true,
      },
    },
  },
  screenshot: {
    name: 'screenshot',
    description: 'Take a screenshot of the page or an element',
    parameters: {
      selector: {
        type: 'string',
        description: 'Optional CSS selector for specific element',
      },
    },
  },
  wait: {
    name: 'wait',
    description: 'Wait for a specified duration',
    parameters: {
      milliseconds: {
        type: 'number',
        description: 'Duration to wait in milliseconds',
        required: true,
      },
    },
  },
};
