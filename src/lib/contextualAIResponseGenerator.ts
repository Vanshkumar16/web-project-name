/**
 * AI Context-Aware Response Generator
 * Uses user history to provide personalized, context-aware responses
 */

import { HistoryStorageManager } from './historyStorageManager';
import type {
  AIContextualResponse,
  HistoryContext,
  AIMemory,
  HistoryEntry,
} from './historyTypes';

export class ContextualAIResponseGenerator {
  private historyManager: HistoryStorageManager;
  private aiMemory: AIMemory | null = null;
  private historyContext: HistoryContext | null = null;

  constructor(userId: string = 'default-user') {
    this.historyManager = new HistoryStorageManager(userId);
  }

  /**
   * Initialize the generator
   */
  async initialize(): Promise<void> {
    await this.historyManager.initialize();
    this.aiMemory = await this.historyManager.getAIMemory();
    this.historyContext = await this.historyManager.getHistoryContext();
  }

  /**
   * Generate contextual response based on history
   */
  async generateContextualResponse(
    userQuery: string,
    baseResponse: string,
    queryType: string = 'general',
  ): Promise<AIContextualResponse> {
    await this.ensureInitialized();

    // Get relevant history
    const relevantHistory = await this.findRelevantHistory(userQuery);
    const personalizations = this.generatePersonalization(userQuery, baseResponse);
    const recommendations = await this.generateRecommendations(userQuery);

    // Tailor response based on history
    let tailoredResponse = this.tailorResponseToUser(
      baseResponse,
      personalizations,
      relevantHistory,
    );

    // Add context awareness
    tailoredResponse = this.addHistoricalContext(tailoredResponse, relevantHistory);

    // Add personalization
    if (personalizations.length > 0) {
      tailoredResponse = this.addPersonalization(tailoredResponse, personalizations[0]);
    }

    // Calculate confidence based on history coverage
    const confidence = this.calculateConfidence(relevantHistory, baseResponse);

    return {
      response: tailoredResponse,
      confidence,
      basedOnHistory: relevantHistory.length > 0,
      historicalContext: relevantHistory.map((h) => h.content),
      personalizations,
      recommendations,
    };
  }

  /**
   * Find relevant history entries for the query
   */
  private async findRelevantHistory(query: string): Promise<HistoryEntry[]> {
    const queryLower = query.toLowerCase();
    const keywords = this.extractKeywords(query);

    // Search by keywords in history
    const results = await this.historyManager.queryEntries({
      searchText: keywords[0],
      limit: 10,
    });

    // Also search by tags
    if (keywords.length > 0) {
      const tagResults = await this.historyManager.queryEntries({
        tags: keywords,
        limit: 10,
      });
      results.push(...tagResults);
    }

    // Remove duplicates and sort by relevance
    const unique = [...new Map(results.map((r) => [r.id, r])).values()];
    return unique.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5);
  }

  /**
   * Generate personalizations based on user behavior
   */
  private generatePersonalization(userQuery: string, baseResponse: string): string[] {
    const personalizations: string[] = [];

    if (!this.aiMemory) return personalizations;

    // Adjust based on response preference
    if (this.aiMemory.learnings.preferredResponseLength === 'short' && baseResponse.length > 200) {
      personalizations.push('Shorten response');
    }

    if (this.aiMemory.learnings.preferredFormality === 'casual') {
      personalizations.push('Use casual tone');
    }

    // Add relevant context
    if (this.historyContext) {
      if (
        this.historyContext.userBehavior.focusPreference === 'long' &&
        userQuery.includes('focus')
      ) {
        personalizations.push('Suggest extended focus session');
      }

      if (userQuery.includes('task') && this.historyContext.patterns.commonTasks.length > 0) {
        personalizations.push('Include task context');
      }
    }

    return personalizations;
  }

  /**
   * Tailor response to user
   */
  private tailorResponseToUser(
    baseResponse: string,
    personalizations: string[],
    history: HistoryEntry[],
  ): string {
    let response = baseResponse;

    personalizations.forEach((personalization) => {
      if (personalization === 'Shorten response' && response.length > 200) {
        // Shorten to first 150 chars + ellipsis
        response = response.substring(0, 150).trim() + '...';
      }

      if (personalization === 'Use casual tone') {
        response = response
          .replace(/Please note/g, 'Just so you know')
          .replace(/Furthermore/g, 'Plus')
          .replace(/However/g, 'But');
      }
    });

    return response;
  }

  /**
   * Add historical context to response
   */
  private addHistoricalContext(response: string, relevantHistory: HistoryEntry[]): string {
    if (relevantHistory.length === 0) return response;

    let contextualResponse = response;

    // Add reference to similar past activity
    if (relevantHistory.length > 0) {
      const mostRecent = relevantHistory[0];
      contextualResponse += `\n\nBased on your recent ${mostRecent.type}: "${mostRecent.content}"`;
    }

    // Add success rate context
    const successfulOnes = relevantHistory.filter((h) => h.success).length;
    if (relevantHistory.length > 0 && successfulOnes > 0) {
      const rate = ((successfulOnes / relevantHistory.length) * 100).toFixed(0);
      contextualResponse += `\nYour success rate on similar actions: ${rate}%`;
    }

    return contextualResponse;
  }

  /**
   * Add personalization to response
   */
  private addPersonalization(response: string, personalization: string): string {
    let personalizedResponse = response;

    if (personalization === 'Suggest extended focus session') {
      personalizedResponse += '\n💡 Tip: Based on your patterns, you perform best with 90-minute sessions.';
    }

    if (personalization === 'Include task context') {
      personalizedResponse += '\n📌 Remember: This aligns with your recent task patterns.';
    }

    return personalizedResponse;
  }

  /**
   * Generate recommendations based on history
   */
  private async generateRecommendations(userQuery: string): Promise<string[]> {
    const recommendations: string[] = [];

    if (!this.historyContext) return recommendations;

    // Recommend based on peak hours
    const now = new Date();
    const currentHour = now.getHours();
    const isNotPeakHour = !this.historyContext.patterns.preferredTimes.some(
      (t) => t.getHours() === currentHour,
    );

    if (isNotPeakHour && userQuery.includes('focus')) {
      const peakHour = this.historyContext.patterns.preferredTimes[0];
      if (peakHour) {
        recommendations.push(
          `You're more productive at ${peakHour.getHours()}:00. Consider scheduling this task then.`,
        );
      }
    }

    // Recommend based on failure patterns
    if (
      this.historyContext.patterns.frequentFails.length > 0 &&
      this.historyContext.patterns.frequentFails[0]
    ) {
      recommendations.push(
        `Tip: You've had issues with "${this.historyContext.patterns.frequentFails[0]}". Here are tips to avoid it.`,
      );
    }

    return recommendations;
  }

  /**
   * Calculate confidence based on history match
   */
  private calculateConfidence(relevantHistory: HistoryEntry[], response: string): number {
    let confidence = 0.5; // Base confidence

    // More relevant history = higher confidence
    confidence += Math.min(relevantHistory.length * 0.1, 0.3);

    // Success rate in history
    if (relevantHistory.length > 0) {
      const successRate = relevantHistory.filter((h) => h.success).length / relevantHistory.length;
      confidence += successRate * 0.2;
    }

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  /**
   * Learn from user feedback
   */
  async learnFromFeedback(
    query: string,
    response: string,
    userRating: number,
    feedback?: string,
  ): Promise<void> {
    await this.ensureInitialized();

    // Update AI memory based on feedback
    let memory = this.aiMemory || this.createDefaultMemory();

    // Track response quality
    if (userRating > 0.7) {
      memory.learnings.successPatterns.push(query);
    } else {
      memory.learnings.frequentErrors.push(query);
    }

    // Keep last 50 patterns
    memory.learnings.successPatterns = memory.learnings.successPatterns.slice(-50);
    memory.learnings.frequentErrors = memory.learnings.frequentErrors.slice(-50);

    memory.lastUpdated = new Date();

    await this.historyManager.storeAIMemory(memory);
    this.aiMemory = memory;
  }

  /**
   * Get learning summary
   */
  async getLearningsSummary(): Promise<{
    successPatterns: string[];
    commonErrors: string[];
    preferredStyle: string;
    recommendations: string[];
  }> {
    await this.ensureInitialized();

    if (!this.aiMemory) {
      return {
        successPatterns: [],
        commonErrors: [],
        preferredStyle: 'balanced',
        recommendations: [],
      };
    }

    const recommendations: string[] = [];

    // Generate recommendations based on learnings
    if (this.aiMemory.learnings.frequentErrors.length > 0) {
      recommendations.push(
        `Avoid: ${this.aiMemory.learnings.frequentErrors[0]}`,
      );
    }

    if (this.aiMemory.learnings.successPatterns.length > 0) {
      recommendations.push(
        `Success pattern: ${this.aiMemory.learnings.successPatterns[0]}`,
      );
    }

    return {
      successPatterns: this.aiMemory.learnings.successPatterns,
      commonErrors: this.aiMemory.learnings.frequentErrors,
      preferredStyle: this.aiMemory.learnings.preferredFormality,
      recommendations,
    };
  }

  /**
   * Predict next action based on history
   */
  async predictNextAction(): Promise<string | null> {
    await this.ensureInitialized();

    if (!this.historyContext) return null;

    // Based on common patterns
    if (this.historyContext.patterns.commonTasks.length > 0) {
      return `Next likely task: "${this.historyContext.patterns.commonTasks[0]}"`;
    }

    // Based on time patterns
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    const isPeakHour = this.historyContext.patterns.preferredTimes.some(
      (t) => t.getHours() === nextHour,
    );

    if (isPeakHour) {
      return 'Upcoming peak productivity hour - consider scheduling important tasks now.';
    }

    return null;
  }

  /**
   * Ensure initialization
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.aiMemory) {
      await this.initialize();
    }
  }

  /**
   * Create default AI memory
   */
  private createDefaultMemory(): AIMemory {
    return {
      userId: this.historyManager['userId'],
      lastUpdated: new Date(),
      learnings: {
        preferredResponseLength: 'medium',
        preferredFormality: 'professional',
        commandPatterns: [],
        frequentErrors: [],
        successPatterns: [],
      },
      contextualUnderstanding: {
        currentFocus: '',
        recentTasks: [],
        upcomingDeadlines: [],
        commonChallenges: [],
      },
    };
  }
}
