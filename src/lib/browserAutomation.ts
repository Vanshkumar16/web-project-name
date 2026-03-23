/**
 * Browser Automation Executor
 * Executes automation commands on the current page
 */

import type {
  BrowserAutomationAction,
  FormFillPayload,
  ExtractDataPayload,
  NavigatePayload,
  ClickPayload,
  ScreenshotPayload,
  WaitPayload,
  CommandResult,
} from './voiceflow.types';

export class BrowserAutomationExecutor {
  async executeAction(action: BrowserAutomationAction): Promise<CommandResult> {
    try {
      switch (action.type) {
        case 'fillForm':
          return await this.fillForm(action.payload as FormFillPayload);
        case 'extractData':
          return await this.extractData(action.payload as ExtractDataPayload);
        case 'navigate':
          return await this.navigate(action.payload as NavigatePayload);
        case 'click':
          return await this.click(action.payload as ClickPayload);
        case 'screenshot':
          return await this.takeScreenshot(action.payload as ScreenshotPayload);
        case 'wait':
          return await this.wait(action.payload as WaitPayload);
        default:
          return {
            success: false,
            message: 'Unknown action type',
            error: `Action type ${(action as any).type} not recognized`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Action execution failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async fillForm(payload: FormFillPayload): Promise<CommandResult> {
    try {
      const { selectors, values, submitSelector } = payload;

      // Fill each field
      for (const [fieldName, selector] of Object.entries(selectors)) {
        const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!element) {
          throw new Error(`Element not found for field "${fieldName}" with selector "${selector}"`);
        }

        const value = values[fieldName];
        if (value === undefined) {
          throw new Error(`No value provided for field "${fieldName}"`);
        }

        // Set value and trigger events for reactivity
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Submit form if selector provided
      if (submitSelector) {
        const submitButton = document.querySelector(submitSelector) as HTMLButtonElement | null;
        if (!submitButton) {
          throw new Error(`Submit button not found with selector "${submitSelector}"`);
        }
        submitButton.click();
      }

      return {
        success: true,
        message: `Successfully filled form with ${Object.keys(selectors).length} fields`,
        data: { fieldsCount: Object.keys(selectors).length },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Form fill failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async extractData(payload: ExtractDataPayload): Promise<CommandResult> {
    try {
      const { selector, property } = payload;

      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found with selector "${selector}"`);
      }

      let data: string;
      switch (property) {
        case 'text':
          data = element.textContent || '';
          break;
        case 'html':
          data = element.innerHTML;
          break;
        case 'value':
          data = (element as any).value || '';
          break;
        default:
          throw new Error(`Unknown property "${property}"`);
      }

      return {
        success: true,
        message: `Successfully extracted ${property} from element`,
        data: { [property]: data },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Data extraction failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async navigate(payload: NavigatePayload): Promise<CommandResult> {
    try {
      const { url, waitSelector, timeout = 5000 } = payload;

      window.location.href = url;

      // Wait for selector if provided
      if (waitSelector) {
        await this.waitForElement(waitSelector, timeout);
      } else {
        // Wait for basic page load
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        message: `Successfully navigated to ${url}`,
        data: { url },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Navigation failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async click(payload: ClickPayload): Promise<CommandResult> {
    try {
      const { selector } = payload;

      const element = document.querySelector(selector) as HTMLElement | null;
      if (!element) {
        throw new Error(`Element not found with selector "${selector}"`);
      }

      element.click();

      // Wait a bit for action to process
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        message: `Successfully clicked element with selector "${selector}"`,
        data: { selector },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Click action failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async takeScreenshot(payload: ScreenshotPayload): Promise<CommandResult> {
    try {
      const { selector } = payload;

      let element: Element | null = selector ? document.querySelector(selector) : document.documentElement;

      if (!element) {
        throw new Error(`Element not found with selector "${selector}"`);
      }

      // Use html2canvas if available, otherwise return placeholder
      if ((window as any).html2canvas) {
        const canvas = await (window as any).html2canvas(element);
        const dataUrl = canvas.toDataURL('image/png');

        return {
          success: true,
          message: 'Screenshot captured',
          data: { dataUrl },
        };
      } else {
        return {
          success: true,
          message: 'Screenshot request noted (html2canvas not available)',
          data: { selector: selector || 'full page' },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Screenshot failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async wait(payload: WaitPayload): Promise<CommandResult> {
    try {
      const { milliseconds } = payload;

      if (milliseconds < 0 || milliseconds > 60000) {
        throw new Error('Wait duration must be between 0 and 60000 milliseconds');
      }

      await new Promise((resolve) => setTimeout(resolve, milliseconds));

      return {
        success: true,
        message: `Successfully waited for ${milliseconds}ms`,
        data: { milliseconds },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Wait action failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async waitForElement(selector: string, timeout: number): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const check = () => {
        if (document.querySelector(selector)) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for element "${selector}"`));
        } else {
          setTimeout(check, 100);
        }
      };

      check();
    });
  }
}
