/**
 * Productivity Tools for VoiceFlow
 * Advanced tools for task management, automation, and productivity
 */

export interface ProductivityTool {
  name: string;
  description: string;
  category: 'task' | 'time' | 'focus' | 'workflow' | 'productivity';
  parameters: Record<string, any>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  tags: string[];
  subtasks: Task[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  params: Record<string, any>;
  timeout?: number;
  retryCount?: number;
}

export interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  task?: string;
  distractionCount: number;
  isActive: boolean;
}

export interface ProductivityMetrics {
  tasksCompleted: number;
  tasksCreated: number;
  averageTaskTime: number; // in minutes
  focusTime: number; // in minutes
  workflowsExecuted: number;
  productivityScore: number; // 0-100
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  tags: string[];
}

export interface QuickAction {
  id: string;
  name: string;
  voice_command: string;
  action: string;
  parameters: Record<string, any>;
  category: string;
}

// Productivity Tools Definitions
export const PRODUCTIVITY_TOOLS: Record<string, ProductivityTool> = {
  // Task Management
  createTask: {
    name: 'createTask',
    description: 'Create a new task with title, description, and priority',
    category: 'task',
    parameters: {
      title: { type: 'string', description: 'Task title', required: true },
      description: { type: 'string', description: 'Task description' },
      priority: {
        type: 'string',
        description: 'Priority: low, medium, high, urgent',
      },
      dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
      tags: { type: 'array', description: 'Tags for task organization' },
    },
  },

  completeTask: {
    name: 'completeTask',
    description: 'Mark a task as complete',
    category: 'task',
    parameters: {
      taskId: { type: 'string', description: 'Task ID', required: true },
    },
  },

  listTasks: {
    name: 'listTasks',
    description: 'List tasks by status, priority, or date',
    category: 'task',
    parameters: {
      filter: {
        type: 'string',
        description: 'Filter: all, completed, pending, urgent, today',
      },
      sort: {
        type: 'string',
        description: 'Sort by: priority, dueDate, created',
      },
    },
  },

  updateTask: {
    name: 'updateTask',
    description: 'Update a task',
    category: 'task',
    parameters: {
      taskId: { type: 'string', description: 'Task ID', required: true },
      updates: {
        type: 'object',
        description: 'Fields to update',
      },
    },
  },

  // Time Management
  startTimer: {
    name: 'startTimer',
    description: 'Start a timer for a task or activity',
    category: 'time',
    parameters: {
      duration: {
        type: 'number',
        description: 'Duration in minutes',
        required: true,
      },
      label: { type: 'string', description: 'Timer label' },
      autoTask: { type: 'boolean', description: 'Auto-create task' },
    },
  },

  setReminder: {
    name: 'setReminder',
    description: 'Set a reminder for specific time',
    category: 'time',
    parameters: {
      message: { type: 'string', description: 'Reminder message', required: true },
      time: { type: 'string', description: 'Time (HH:MM or relative)' },
      recurring: { type: 'string', description: 'Daily, weekly, etc.' },
    },
  },

  // Focus Mode
  startFocusMode: {
    name: 'startFocusMode',
    description: 'Start a focus session with productivity tracking',
    category: 'focus',
    parameters: {
      duration: {
        type: 'number',
        description: 'Session duration in minutes',
        required: true,
      },
      taskId: { type: 'string', description: 'Associated task' },
      blockDistractions: {
        type: 'boolean',
        description: 'Block notifications',
      },
      autoBreak: {
        type: 'boolean',
        description: 'Automatic break reminders',
      },
    },
  },

  endFocusMode: {
    name: 'endFocusMode',
    description: 'End current focus session',
    category: 'focus',
    parameters: {},
  },

  // Workflow Automation
  createWorkflow: {
    name: 'createWorkflow',
    description: 'Create a reusable workflow/automation sequence',
    category: 'workflow',
    parameters: {
      name: { type: 'string', description: 'Workflow name', required: true },
      description: { type: 'string', description: 'Workflow description' },
      steps: { type: 'array', description: 'Array of steps' },
    },
  },

  executeWorkflow: {
    name: 'executeWorkflow',
    description: 'Execute a saved workflow',
    category: 'workflow',
    parameters: {
      workflowId: {
        type: 'string',
        description: 'Workflow ID',
        required: true,
      },
      parameters: { type: 'object', description: 'Workflow parameters' },
    },
  },

  chainTasks: {
    name: 'chainTasks',
    description: 'Chain multiple tasks and actions together',
    category: 'workflow',
    parameters: {
      tasks: { type: 'array', description: 'Array of task IDs' },
      parallel: { type: 'boolean', description: 'Execute in parallel' },
    },
  },

  // Productivity Shortcuts
  quickEmail: {
    name: 'quickEmail',
    description: 'Send email using template or quick draft',
    category: 'productivity',
    parameters: {
      recipient: { type: 'string', description: 'Email recipient', required: true },
      template: { type: 'string', description: 'Email template name' },
      subject: { type: 'string', description: 'Email subject' },
      body: { type: 'string', description: 'Email body' },
    },
  },

  scheduleEmail: {
    name: 'scheduleEmail',
    description: 'Schedule email for later',
    category: 'productivity',
    parameters: {
      recipient: { type: 'string', description: 'Email recipient', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
      sendTime: { type: 'string', description: 'Send time (YYYY-MM-DD HH:MM)' },
    },
  },

  takeNote: {
    name: 'takeNote',
    description: 'Quick voice note capturing',
    category: 'productivity',
    parameters: {
      title: { type: 'string', description: 'Note title', required: true },
      content: { type: 'string', description: 'Note content', required: true },
      tags: { type: 'array', description: 'Note tags' },
      attach: { type: 'array', description: 'Attach to task/project' },
    },
  },

  getProductivityMetrics: {
    name: 'getProductivityMetrics',
    description: 'Get productivity statistics and insights',
    category: 'productivity',
    parameters: {
      period: { type: 'string', description: 'today, week, month, year' },
      metrics: { type: 'array', description: 'Specific metrics to retrieve' },
    },
  },

  // Calendar & Scheduling
  scheduleEvent: {
    name: 'scheduleEvent',
    description: 'Schedule a calendar event',
    category: 'productivity',
    parameters: {
      title: { type: 'string', description: 'Event title', required: true },
      startTime: { type: 'string', description: 'Start time', required: true },
      endTime: { type: 'string', description: 'End time', required: true },
      description: { type: 'string', description: 'Event description' },
      attendees: { type: 'array', description: 'Attendee emails' },
      location: { type: 'string', description: 'Event location' },
    },
  },

  checkCalendar: {
    name: 'checkCalendar',
    description: 'Check calendar availability',
    category: 'productivity',
    parameters: {
      date: { type: 'string', description: 'Date to check' },
      duration: { type: 'number', description: 'Duration needed in minutes' },
      showNext: {
        type: 'number',
        description: 'Show next N available slots',
      },
    },
  },

  // Focus & Distraction Blocking
  blockSite: {
    name: 'blockSite',
    description: 'Block distracting websites',
    category: 'focus',
    parameters: {
      urls: { type: 'array', description: 'URLs to block', required: true },
      duration: {
        type: 'number',
        description: 'Duration in minutes',
        required: true,
      },
      whitelist: {
        type: 'boolean',
        description: 'Whitelist mode (block all except)',
      },
    },
  },

  enableDND: {
    name: 'enableDND',
    description: 'Enable Do Not Disturb mode',
    category: 'focus',
    parameters: {
      duration: {
        type: 'number',
        description: 'Duration in minutes',
        required: true,
      },
      allowVIP: {
        type: 'array',
        description: 'Allow notifications from VIP contacts',
      },
    },
  },

  // Analytics & Reporting
  generateReport: {
    name: 'generateReport',
    description: 'Generate productivity report',
    category: 'productivity',
    parameters: {
      type: {
        type: 'string',
        description: 'Report type: daily, weekly, monthly, custom',
      },
      include: {
        type: 'array',
        description: 'Report sections to include',
      },
      format: { type: 'string', description: 'Format: pdf, email, screen' },
    },
  },

  analyzeBehavior: {
    name: 'analyzeBehavior',
    description: 'Analyze productivity patterns and give recommendations',
    category: 'productivity',
    parameters: {
      period: { type: 'string', description: 'Analysis period' },
      focus: { type: 'string', description: 'Focus area for analysis' },
    },
  },
};
