/**
 * Tool Calling Parser Tests
 */

import { ToolCallingParser } from '../src/lib/toolCallingParser';

describe('ToolCallingParser', () => {
  test('should parse XML format tool calls', () => {
    const response = `
      Here's how I'll help you fill the form:
      <tool_call>
        <name>fillForm</name>
        <parameters>
          <selectors>{"email": "#email-field", "name": "#name-input"}</selectors>
          <values>{"email": "user@example.com", "name": "John Doe"}</values>
        </parameters>
      </tool_call>
    `;

    const toolCalls = ToolCallingParser.parseToolCalls(response);
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].toolName).toBe('fillForm');
  });

  test('should parse multiple tool calls', () => {
    const response = `
      <tool_call>
        <name>navigate</name>
        <parameters>
          <url>https://example.com</url>
        </parameters>
      </tool_call>
      <tool_call>
        <name>click</name>
        <parameters>
          <selector>#submit-btn</selector>
        </parameters>
      </tool_call>
    `;

    const toolCalls = ToolCallingParser.parseToolCalls(response);
    expect(toolCalls).toHaveLength(2);
    expect(toolCalls[0].toolName).toBe('navigate');
    expect(toolCalls[1].toolName).toBe('click');
  });

  test('should extract intent from response', () => {
    const response = `
      I'll fill the contact form for you.
      <tool_call>
        <name>fillForm</name>
        <parameters>
          <selectors>{"email": "#email"}</selectors>
          <values>{"email": "test@test.com"}</values>
        </parameters>
      </tool_call>
    `;

    const intent = ToolCallingParser.extractIntent(response);
    expect(intent).not.toBeNull();
    expect(intent?.tools).toHaveLength(1);
    expect(intent?.description).toContain('contact form');
  });

  test('should validate tool calls against definitions', () => {
    const invalidResponse = `
      <tool_call>
        <name>unknownTool</name>
        <parameters>
          <param>value</param>
        </parameters>
      </tool_call>
    `;

    const toolCalls = ToolCallingParser.parseToolCalls(invalidResponse);
    expect(toolCalls).toHaveLength(0);
  });

  test('should generate tool schema for system prompt', () => {
    const schema = ToolCallingParser.generateToolSchema();
    expect(schema).toContain('fillForm');
    expect(schema).toContain('navigate');
    expect(schema).toContain('extractData');
    expect(schema).toContain('tool_call');
  });

  test('should handle missing required parameters', () => {
    const response = `
      <tool_call>
        <name>navigate</name>
        <parameters>
          <waitSelector>#element</waitSelector>
        </parameters>
      </tool_call>
    `;

    const toolCalls = ToolCallingParser.parseToolCalls(response);
    // Should reject because url is required but missing
    expect(toolCalls).toHaveLength(0);
  });
});
