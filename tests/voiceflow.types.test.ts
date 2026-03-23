/**
 * VoiceFlow Types Tests
 */

import type {
  BrowserAutomationTool,
  ToolCall,
  CommandIntent,
  VoiceFlowCommand,
  FormFillPayload,
  ExtractDataPayload,
  NavigatePayload,
} from '../src/lib/voiceflow.types';
import { BROWSER_AUTOMATION_TOOLS } from '../src/lib/voiceflow.types';

describe('VoiceFlow Types', () => {
  test('should have all browser automation tools defined', () => {
    const toolNames = Object.keys(BROWSER_AUTOMATION_TOOLS);
    expect(toolNames).toContain('fillForm');
    expect(toolNames).toContain('navigate');
    expect(toolNames).toContain('extractData');
    expect(toolNames).toContain('click');
    expect(toolNames).toContain('screenshot');
    expect(toolNames).toContain('wait');
  });

  test('fillForm tool should have required parameters', () => {
    const tool = BROWSER_AUTOMATION_TOOLS.fillForm;
    expect(tool.parameters).toHaveProperty('selectors');
    expect(tool.parameters).toHaveProperty('values');
    expect(tool.parameters.selectors.required).toBe(true);
    expect(tool.parameters.values.required).toBe(true);
  });

  test('navigate tool should have URL as required parameter', () => {
    const tool = BROWSER_AUTOMATION_TOOLS.navigate;
    expect(tool.parameters.url.required).toBe(true);
  });

  test('wait tool should have milliseconds as required parameter', () => {
    const tool = BROWSER_AUTOMATION_TOOLS.wait;
    expect(tool.parameters.milliseconds.required).toBe(true);
  });
});
