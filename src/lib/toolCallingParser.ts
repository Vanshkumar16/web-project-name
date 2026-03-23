/**
 * Tool Calling Parser
 * Parses LLM responses for tool calls
 */

import type { ToolCall, CommandIntent, BrowserAutomationTool } from './voiceflow.types';
import { BROWSER_AUTOMATION_TOOLS } from './voiceflow.types';

export class ToolCallingParser {
  /**
   * Parse LLM response to extract tool calls
   * Supports both XML and JSON formats
   */
  static parseToolCalls(response: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    // Try XML format first (default LFM2 format)
    const xmlMatches = response.matchAll(/<tool_call>([\s\S]*?)<\/tool_call>/g);
    for (const match of xmlMatches) {
      try {
        const toolXml = match[1];
        const nameMatch = toolXml.match(/<name>(.*?)<\/name>/);
        const paramsMatch = toolXml.match(/<parameters>([\s\S]*?)<\/parameters>/);

        if (nameMatch && paramsMatch) {
          const toolName = nameMatch[1].trim();
          const paramsStr = paramsMatch[1].trim();

          // Parse parameters (could be JSON or nested XML)
          let parameters: Record<string, unknown>;
          try {
            parameters = JSON.parse(paramsStr);
          } catch {
            // Try to extract key-value pairs from XML-like format
            parameters = this.parseXmlParameters(paramsStr);
          }

          if (this.validateToolCall(toolName, parameters)) {
            toolCalls.push({ toolName, parameters });
          }
        }
      } catch (e) {
        console.warn('Failed to parse tool call:', e);
      }
    }

    // Try JSON format if no XML matches found
    if (toolCalls.length === 0) {
      try {
        const jsonMatch = response.match(/\{[\s\S]*?"tool_calls"[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.tool_calls)) {
            for (const call of parsed.tool_calls) {
              if (
                call.name &&
                call.arguments &&
                this.validateToolCall(call.name, call.arguments)
              ) {
                toolCalls.push({
                  toolName: call.name,
                  parameters: call.arguments,
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse JSON tool calls:', e);
      }
    }

    return toolCalls;
  }

  /**
   * Extract intent description from LLM response
   */
  static extractIntent(response: string): CommandIntent | null {
    const toolCalls = this.parseToolCalls(response);

    if (toolCalls.length === 0) {
      return null;
    }

    // Extract description from response (usually first line or in specific tag)
    let description = '';

    const descMatch = response.match(/<description>(.*?)<\/description>/);
    if (descMatch) {
      description = descMatch[1].trim();
    } else {
      // Use first sentence or first 100 chars
      const sentences = response.split(/[.!?]+/);
      description = sentences[0].trim().substring(0, 100);
    }

    return {
      description: description || 'Execute browser automation',
      tools: toolCalls,
      confidence: 0.85, // Default confidence
    };
  }

  /**
   * Validate tool call against definitions
   */
  private static validateToolCall(toolName: string, parameters: Record<string, unknown>): boolean {
    const toolDef = BROWSER_AUTOMATION_TOOLS[toolName];

    if (!toolDef) {
      console.warn(`Unknown tool: ${toolName}`);
      return false;
    }

    // Check required parameters
    for (const [paramName, paramDef] of Object.entries(toolDef.parameters)) {
      if (paramDef.required && !(paramName in parameters)) {
        console.warn(`Missing required parameter "${paramName}" for tool "${toolName}"`);
        return false;
      }
    }

    return true;
  }

  /**
   * Parse XML-style parameters
   */
  private static parseXmlParameters(xmlStr: string): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    // Match <key>value</key> patterns
    const matches = xmlStr.matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g);
    for (const [, key, value] of matches) {
      // Try to parse value as JSON, otherwise keep as string
      try {
        params[key] = JSON.parse(value);
      } catch {
        params[key] = value;
      }
    }

    return params;
  }

  /**
   * Generate tool definitions schema for LLM system prompt
   */
  static generateToolSchema(): string {
    const toolSchemas = Object.values(BROWSER_AUTOMATION_TOOLS).map((tool) => {
      const params = Object.entries(tool.parameters)
        .map(
          ([name, def]) =>
            `    - ${name} (${def.type}${def.required ? ', required' : ''}): ${def.description}`,
        )
        .join('\n');

      return `- ${tool.name}: ${tool.description}
  Parameters:
${params}`;
    });

    return `Available tools for browser automation:
${toolSchemas.join('\n\n')}

When responding, use XML format for tool calls:
<tool_call>
  <name>tool_name</name>
  <parameters>
    <param_name>value</param_name>
  </parameters>
</tool_call>`;
  }
}
