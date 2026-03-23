/**
 * Browser Automation Executor Tests
 */

import { BrowserAutomationExecutor } from '../src/lib/browserAutomation';
import type { BrowserAutomationAction } from '../src/lib/voiceflow.types';

describe('BrowserAutomationExecutor', () => {
  let executor: BrowserAutomationExecutor;

  beforeEach(() => {
    executor = new BrowserAutomationExecutor();
    // Create test DOM
    document.body.innerHTML = `
      <form id="test-form">
        <input id="email-field" type="email" />
        <input id="name-input" type="text" />
        <textarea id="message"></textarea>
        <button id="submit-btn" type="submit">Submit</button>
      </form>
      <div id="data-container">Test Data</div>
      <button id="clickable">Click Me</button>
    `;
  });

  describe('fillForm', () => {
    test('should fill form fields with provided values', async () => {
      const action: BrowserAutomationAction = {
        type: 'fillForm',
        payload: {
          selectors: {
            email: '#email-field',
            name: '#name-input',
          },
          values: {
            email: 'test@example.com',
            name: 'John Doe',
          },
        },
      };

      const result = await executor.executeAction(action);
      expect(result.success).toBe(true);

      const emailField = document.querySelector('#email-field') as HTMLInputElement;
      const nameInput = document.querySelector('#name-input') as HTMLInputElement;

      expect(emailField.value).toBe('test@example.com');
      expect(nameInput.value).toBe('John Doe');
    });

    test('should handle missing selector gracefully', async () => {
      const action: BrowserAutomationAction = {
        type: 'fillForm',
        payload: {
          selectors: {
            email: '#nonexistent',
          },
          values: {
            email: 'test@example.com',
          },
        },
      };

      const result = await executor.executeAction(action);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should submit form when submitSelector provided', async () => {
      const submitSpy = jest.fn();
      const button = document.querySelector('#submit-btn') as HTMLButtonElement;
      button.onclick = submitSpy;

      const action: BrowserAutomationAction = {
        type: 'fillForm',
        payload: {
          selectors: {
            email: '#email-field',
          },
          values: {
            email: 'test@example.com',
          },
          submitSelector: '#submit-btn',
        },
      };

      await executor.executeAction(action);
      expect(submitSpy).toHaveBeenCalled();
    });
  });

  describe('extractData', () => {
    test('should extract text content from element', async () => {
      const action: BrowserAutomationAction = {
        type: 'extractData',
        payload: {
          selector: '#data-container',
          property: 'text',
        },
      };

      const result = await executor.executeAction(action);
      expect(result.success).toBe(true);
      expect(result.data?.text).toContain('Test Data');
    });

    test('should handle missing selector', async () => {
      const action: BrowserAutomationAction = {
        type: 'extractData',
        payload: {
          selector: '#nonexistent',
          property: 'text',
        },
      };

      const result = await executor.executeAction(action);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should extract value from input fields', async () => {
      const input = document.querySelector('#email-field') as HTMLInputElement;
      input.value = 'preexisting@example.com';

      const action: BrowserAutomationAction = {
        type: 'extractData',
        payload: {
          selector: '#email-field',
          property: 'value',
        },
      };

      const result = await executor.executeAction(action);
      expect(result.success).toBe(true);
      expect(result.data?.value).toBe('preexisting@example.com');
    });
  });

  describe('click', () => {
    test('should click element', async () => {
      const clickSpy = jest.fn();
      const button = document.querySelector('#clickable') as HTMLButtonElement;
      button.onclick = clickSpy;

      const action: BrowserAutomationAction = {
        type: 'click',
        payload: {
          selector: '#clickable',
        },
      };

      await executor.executeAction(action);
      expect(clickSpy).toHaveBeenCalled();
    });

    test('should handle missing element', async () => {
      const action: BrowserAutomationAction = {
        type: 'click',
        payload: {
          selector: '#nonexistent',
        },
      };

      const result = await executor.executeAction(action);
      expect(result.success).toBe(false);
    });
  });

  describe('wait', () => {
    test('should wait for specified duration', async () => {
      const start = Date.now();
      const action: BrowserAutomationAction = {
        type: 'wait',
        payload: {
          milliseconds: 100,
        },
      };

      const result = await executor.executeAction(action);
      const elapsed = Date.now() - start;

      expect(result.success).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    test('should reject invalid duration', async () => {
      const action: BrowserAutomationAction = {
        type: 'wait',
        payload: {
          milliseconds: -100,
        },
      };

      const result = await executor.executeAction(action);
      expect(result.success).toBe(false);
    });
  });

  describe('unknown action', () => {
    test('should handle unknown action type', async () => {
      const action: any = {
        type: 'unknownAction',
        payload: {},
      };

      const result = await executor.executeAction(action);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown');
    });
  });
});
