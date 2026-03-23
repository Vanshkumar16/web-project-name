/**
 * Productivity Dashboard Component
 * Display productivity metrics, tasks, and focus sessions
 */

import { useState, useEffect, useRef } from 'react';
import { ProductivityManager } from '../lib/productivityManager';
import type { ProductivityMetrics, Task, FocusSession } from '../lib/productivityTools';
import '../styles/productivity.css';

export function ProductivityDashboard() {
  const managerRef = useRef<ProductivityManager>(new ProductivityManager());
  const [metrics, setMetrics] = useState<ProductivityMetrics>({
    tasksCompleted: 0,
    tasksCreated: 0,
    averageTaskTime: 0,
    focusTime: 0,
    workflowsExecuted: 0,
    productivityScore: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const manager = managerRef.current;

  useEffect(() => {
    // Subscribe to metrics changes
    const unsubscribe = manager.onMetricsChange((newMetrics) => {
      setMetrics(newMetrics);
      setSuggestions(manager.getProductivitySuggestions());
    });

    // Initial load
    setMetrics(manager.getMetrics());
    setSuggestions(manager.getProductivitySuggestions());
    setTasks(manager.listTasks());

    return unsubscribe;
  }, [manager]);

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return;

    manager.createTask(taskTitle, { priority: taskPriority });
    setTasks(manager.listTasks());
    setTaskTitle('');
    setShowTaskForm(false);
  };

  const handleCompleteTask = (taskId: string) => {
    manager.completeTask(taskId);
    setTasks(manager.listTasks());
    setMetrics(manager.getMetrics());
  };

  const handleStartFocus = (duration: number) => {
    const session = manager.startFocusSession(duration);
    setFocusSession(session);
  };

  const handleEndFocus = () => {
    manager.endFocusSession();
    setFocusSession(null);
  };

  const priorityColor = {
    low: '#4CAF50',
    medium: '#FFC107',
    high: '#FF9800',
    urgent: '#F44336',
  };

  return (
    <div className="productivity-dashboard">
      <header className="productivity-header">
        <h1>📊 Productivity Dashboard</h1>
        <div className="header-stats">
          <span className="stat">
            <strong>{metrics.tasksCompleted}</strong> Tasks Done
          </span>
          <span className="stat">
            <strong>{metrics.productivityScore}</strong> Score
          </span>
          <span className="stat">
            <strong>{metrics.focusTime}</strong>m Focus
          </span>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Productivity Score Card */}
        <div className="card score-card">
          <h2>Productivity Score</h2>
          <div className="score-display">
            <div className="score-circle" style={{ '--score': metrics.productivityScore } as any}>
              <div className="score-text">{metrics.productivityScore}</div>
            </div>
          </div>
          <div className="score-details">
            <p className="score-label">
              {metrics.productivityScore >= 80
                ? '🌟 Excellent'
                : metrics.productivityScore >= 60
                  ? '✅ Good'
                  : metrics.productivityScore >= 40
                    ? '⚠️ Fair'
                    : '❌ Needs Improvement'}
            </p>
          </div>
        </div>

        {/* Focus Session Card */}
        <div className="card focus-card">
          <h2>🎯 Focus Mode</h2>
          {focusSession && focusSession.isActive ? (
            <div className="focus-active">
              <div className="focus-timer">
                <p>Focus Session Active</p>
                <p className="duration">{focusSession.duration} minutes</p>
              </div>
              <button className="btn btn-danger" onClick={handleEndFocus}>
                End Focus
              </button>
            </div>
          ) : (
            <div className="focus-options">
              <button className="btn btn-sm" onClick={() => handleStartFocus(25)}>
                🍅 25 min
              </button>
              <button className="btn btn-sm" onClick={() => handleStartFocus(50)}>
                ⏱️ 50 min
              </button>
              <button className="btn btn-sm" onClick={() => handleStartFocus(90)}>
                🎬 90 min
              </button>
            </div>
          )}
        </div>

        {/* Metrics Cards */}
        <div className="card metrics-card">
          <h3>📈 Today's Stats</h3>
          <div className="metrics-list">
            <div className="metric">
              <span>Tasks Created</span>
              <strong>{metrics.tasksCreated}</strong>
            </div>
            <div className="metric">
              <span>Tasks Completed</span>
              <strong>{metrics.tasksCompleted}</strong>
            </div>
            <div className="metric">
              <span>Avg Task Time</span>
              <strong>{metrics.averageTaskTime}m</strong>
            </div>
            <div className="metric">
              <span>Workflows Run</span>
              <strong>{metrics.workflowsExecuted}</strong>
            </div>
          </div>
        </div>

        {/* Suggestions Card */}
        <div className="card suggestions-card">
          <h3>💡 Smart Suggestions</h3>
          <div className="suggestions-list">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, i) => (
                <div key={i} className="suggestion">
                  {suggestion}
                </div>
              ))
            ) : (
              <p className="no-suggestions">Keep up the great work! 🚀</p>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="tasks-section">
        <h2>📝 Today's Tasks</h2>

        {showTaskForm && (
          <div className="task-form">
            <input
              type="text"
              placeholder="Task title..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              autoFocus
            />
            <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as any)}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            <div className="form-buttons">
              <button className="btn btn-sm btn-primary" onClick={handleCreateTask}>
                Add Task
              </button>
              <button className="btn btn-sm" onClick={() => setShowTaskForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {!showTaskForm && (
          <button className="btn btn-primary" onClick={() => setShowTaskForm(true)}>
            ➕ New Task
          </button>
        )}

        <div className="tasks-list">
          {tasks.filter((t) => !t.completed).map((task) => (
            <div key={task.id} className="task-item">
              <div
                className="task-priority"
                style={{ backgroundColor: priorityColor[task.priority] }}
              />
              <div className="task-content">
                <h4>{task.title}</h4>
                {task.description && <p className="task-description">{task.description}</p>}
                <div className="task-meta">
                  <span className="priority">{task.priority}</span>
                  {task.tags.map((tag) => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleCompleteTask(task.id)}
              >
                ✓
              </button>
            </div>
          ))}
        </div>

        {tasks.filter((t) => !t.completed).length === 0 && (
          <div className="no-tasks">
            <p>🎉 All tasks completed!</p>
            <p>Great job today!</p>
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      <div className="completed-tasks-section">
        <h3>✅ Completed ({tasks.filter((t) => t.completed).length})</h3>
        <div className="completed-list">
          {tasks
            .filter((t) => t.completed)
            .map((task) => (
              <div key={task.id} className="completed-item">
                <span>{task.title}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
