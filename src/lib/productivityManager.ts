/**
 * Productivity Manager
 * Handles task management, workflows, focus sessions, and productivity metrics
 */

import type {
  Task,
  Workflow,
  WorkflowStep,
  FocusSession,
  ProductivityMetrics,
  EmailTemplate,
  QuickAction,
} from './productivityTools';

type ProductivityListener = (metrics: ProductivityMetrics) => void;

export class ProductivityManager {
  private tasks: Map<string, Task> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private focusSessions: FocusSession[] = [];
  private currentFocusSession: FocusSession | null = null;
  private emailTemplates: Map<string, EmailTemplate> = new Map();
  private quickActions: Map<string, QuickAction> = new Map();
  private reminders: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private metricsListeners: Set<ProductivityListener> = new Set();
  private startTime: Date = new Date();

  /**
   * Task Management
   */

  createTask(
    title: string,
    options: {
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: Date;
      tags?: string[];
    } = {},
  ): Task {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: options.description,
      priority: options.priority || 'medium',
      dueDate: options.dueDate,
      completed: false,
      createdAt: new Date(),
      tags: options.tags || [],
      subtasks: [],
    };

    this.tasks.set(task.id, task);
    return task;
  }

  completeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.completed = true;
    task.completedAt = new Date();
    this.notifyMetricsChange();
    return true;
  }

  updateTask(taskId: string, updates: Partial<Task>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    Object.assign(task, updates);
    return true;
  }

  listTasks(filter: 'all' | 'completed' | 'pending' | 'urgent' | 'today' = 'all'): Task[] {
    const allTasks = Array.from(this.tasks.values());

    switch (filter) {
      case 'completed':
        return allTasks.filter((t) => t.completed);
      case 'pending':
        return allTasks.filter((t) => !t.completed);
      case 'urgent':
        return allTasks.filter((t) => !t.completed && t.priority === 'urgent');
      case 'today':
        const today = new Date();
        return allTasks.filter(
          (t) =>
            !t.completed &&
            t.dueDate &&
            t.dueDate.toDateString() === today.toDateString(),
        );
      default:
        return allTasks;
    }
  }

  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  addSubtask(parentTaskId: string, subtask: Task): boolean {
    const parent = this.tasks.get(parentTaskId);
    if (!parent) return false;

    parent.subtasks.push(subtask);
    return true;
  }

  /**
   * Workflow Management
   */

  createWorkflow(name: string, steps: WorkflowStep[], description?: string): Workflow {
    const workflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name,
      description: description || '',
      steps,
      createdAt: new Date(),
      usageCount: 0,
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  executeWorkflow(workflowId: string): Promise<any[]> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return Promise.reject(new Error(`Workflow ${workflowId} not found`));
    }

    workflow.lastUsed = new Date();
    workflow.usageCount++;

    return Promise.all(
      workflow.steps.map((step) => this.executeStep(step)),
    );
  }

  private async executeStep(step: WorkflowStep): Promise<any> {
    return new Promise((resolve) => {
      const timeout = step.timeout || 5000;
      setTimeout(() => {
        resolve({
          stepId: step.id,
          action: step.action,
          status: 'completed',
        });
      }, timeout);
    });
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  deleteWorkflow(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  /**
   * Focus Session Management
   */

  startFocusSession(duration: number, taskId?: string): FocusSession {
    if (this.currentFocusSession?.isActive) {
      this.endFocusSession();
    }

    const session: FocusSession = {
      id: `focus_${Date.now()}`,
      startTime: new Date(),
      duration,
      task: taskId,
      distractionCount: 0,
      isActive: true,
    };

    this.currentFocusSession = session;
    this.focusSessions.push(session);

    // Auto-end after duration
    setTimeout(() => {
      this.endFocusSession();
    }, duration * 60 * 1000);

    return session;
  }

  endFocusSession(): FocusSession | null {
    if (!this.currentFocusSession) return null;

    this.currentFocusSession.isActive = false;
    this.currentFocusSession.endTime = new Date();

    const session = this.currentFocusSession;
    this.currentFocusSession = null;

    this.notifyMetricsChange();
    return session;
  }

  getCurrentFocusSession(): FocusSession | null {
    return this.currentFocusSession;
  }

  logDistraction(): void {
    if (this.currentFocusSession) {
      this.currentFocusSession.distractionCount++;
    }
  }

  getFocusHistory(): FocusSession[] {
    return [...this.focusSessions];
  }

  /**
   * Email Templates
   */

  createEmailTemplate(
    name: string,
    subject: string,
    body: string,
    tags?: string[],
  ): EmailTemplate {
    const template: EmailTemplate = {
      id: `email_${Date.now()}`,
      name,
      subject,
      body,
      tags: tags || [],
    };

    this.emailTemplates.set(template.id, template);
    return template;
  }

  getEmailTemplate(id: string): EmailTemplate | undefined {
    return this.emailTemplates.get(id);
  }

  listEmailTemplates(): EmailTemplate[] {
    return Array.from(this.emailTemplates.values());
  }

  /**
   * Quick Actions
   */

  createQuickAction(
    name: string,
    voiceCommand: string,
    action: string,
    parameters: Record<string, any>,
  ): QuickAction {
    const quickAction: QuickAction = {
      id: `action_${Date.now()}`,
      name,
      voice_command: voiceCommand,
      action,
      parameters,
      category: 'custom',
    };

    this.quickActions.set(quickAction.id, quickAction);
    return quickAction;
  }

  listQuickActions(): QuickAction[] {
    return Array.from(this.quickActions.values());
  }

  /**
   * Reminders
   */

  setReminder(message: string, delayMs: number): string {
    const id = `reminder_${Date.now()}`;

    const timeout = setTimeout(() => {
      console.log(`📢 Reminder: ${message}`);
      this.reminders.delete(id);
    }, delayMs);

    this.reminders.set(id, timeout);
    return id;
  }

  cancelReminder(id: string): boolean {
    const timeout = this.reminders.get(id);
    if (!timeout) return false;

    clearTimeout(timeout);
    this.reminders.delete(id);
    return true;
  }

  /**
   * Productivity Metrics
   */

  getMetrics(period: 'today' | 'week' | 'month' = 'today'): ProductivityMetrics {
    const completedTasks = Array.from(this.tasks.values()).filter((t) => t.completed);
    const totalTasks = Array.from(this.tasks.values());

    const completedFocusSessions = this.focusSessions.filter((s) => s.endTime);
    const totalFocusTime = completedFocusSessions.reduce((sum, s) => sum + s.duration, 0);

    const avgTaskTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => {
            if (!t.completedAt || !t.createdAt) return sum;
            return sum + (t.completedAt.getTime() - t.createdAt.getTime());
          }, 0) /
          completedTasks.length /
          60000
        : 0;

    const productivity = this.calculateProductivityScore(
      completedTasks.length,
      totalFocusTime,
      completedFocusSessions.reduce((sum, s) => sum + s.distractionCount, 0),
    );

    return {
      tasksCompleted: completedTasks.length,
      tasksCreated: totalTasks.length,
      averageTaskTime: Math.round(avgTaskTime),
      focusTime: totalFocusTime,
      workflowsExecuted: Array.from(this.workflows.values()).reduce(
        (sum, w) => sum + w.usageCount,
        0,
      ),
      productivityScore: productivity,
    };
  }

  private calculateProductivityScore(
    tasksCompleted: number,
    focusTime: number,
    distractions: number,
  ): number {
    let score = 50; // Base score

    // Task completion (max +30)
    score += Math.min(tasksCompleted * 5, 30);

    // Focus time (max +15)
    score += Math.min(focusTime / 10, 15);

    // Distractions (max -15)
    score -= Math.min(distractions * 2, 15);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Event Listeners
   */

  onMetricsChange(listener: ProductivityListener): () => void {
    this.metricsListeners.add(listener);
    return () => this.metricsListeners.delete(listener);
  }

  private notifyMetricsChange(): void {
    const metrics = this.getMetrics();
    this.metricsListeners.forEach((listener) => listener(metrics));
  }

  /**
   * Suggestions & AI
   */

  getProductivitySuggestions(): string[] {
    const metrics = this.getMetrics();
    const suggestions: string[] = [];

    if (metrics.tasksCompleted === 0 && metrics.tasksCreated > 0) {
      suggestions.push('You have pending tasks. Start with the most urgent one.');
    }

    if (metrics.focusTime < 60) {
      suggestions.push('Try using focus sessions to improve concentration.');
    }

    const avgTasks = metrics.tasksCreated > 0 ? metrics.tasksCompleted / metrics.tasksCreated : 0;
    if (avgTasks < 0.5) {
      suggestions.push('Consider breaking down large tasks into smaller subtasks.');
    }

    if (metrics.productivityScore < 50) {
      suggestions.push('Take a break and enable focus mode for the next task.');
    }

    return suggestions;
  }

  /**
   * Analytics
   */

  analyzeTrends(): {
    peakProductivityHour: number;
    averageTasksPerDay: number;
    completionRate: number;
  } {
    const completedTasks = Array.from(this.tasks.values()).filter((t) => t.completed);
    const totalTasks = Array.from(this.tasks.values());

    return {
      peakProductivityHour: 14, // Placeholder
      averageTasksPerDay: totalTasks.length > 0 ? totalTasks.length / 7 : 0,
      completionRate: totalTasks.length > 0 ? completedTasks.length / totalTasks.length : 0,
    };
  }

  /**
   * Export & Import
   */

  exportData(): string {
    return JSON.stringify({
      tasks: Array.from(this.tasks.values()),
      workflows: Array.from(this.workflows.values()),
      focusSessions: this.focusSessions,
      emailTemplates: Array.from(this.emailTemplates.values()),
      quickActions: Array.from(this.quickActions.values()),
      exportedAt: new Date().toISOString(),
    });
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.tasks) {
        data.tasks.forEach((task: Task) => {
          this.tasks.set(task.id, task);
        });
      }
      if (data.workflows) {
        data.workflows.forEach((workflow: Workflow) => {
          this.workflows.set(workflow.id, workflow);
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}
