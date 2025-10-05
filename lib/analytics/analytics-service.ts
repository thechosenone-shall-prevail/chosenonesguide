// Analytics Service

import { db } from "@/lib/db";
import {
  analyticsEvent,
  usageLog,
  project,
  agentTask,
  deployment,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import type {
  AnalyticsEvent,
  UserStats,
  AgentPerformance,
  CodeQualityMetrics,
  ProjectReport,
  AnalyticsPeriod,
  ChartData,
} from "./types";

export class AnalyticsService {
  /**
   * Track an analytics event
   */
  async trackEvent(params: {
    userId: string;
    eventType: string;
    eventData?: Record<string, any>;
  }): Promise<void> {
    try {
      await db.insert(analyticsEvent).values({
        userId: params.userId,
        eventType: params.eventType,
        eventData: params.eventData || {},
      });
    } catch (error) {
      console.error("Track event error:", error);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(
    userId: string,
    period?: AnalyticsPeriod
  ): Promise<UserStats> {
    try {
      const start = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = period?.end || new Date();

      // Get message count
      const messageEvents = await db
        .select({ count: count() })
        .from(analyticsEvent)
        .where(
          and(
            eq(analyticsEvent.userId, userId),
            eq(analyticsEvent.eventType, "message_sent"),
            gte(analyticsEvent.createdAt, start),
            lte(analyticsEvent.createdAt, end)
          )
        );

      // Get projects created
      const projectsCreated = await db
        .select({ count: count() })
        .from(project)
        .where(
          and(
            eq(project.creatorId, userId),
            gte(project.createdAt, start),
            lte(project.createdAt, end)
          )
        );

      // Get token usage
      const usage = await db
        .select()
        .from(usageLog)
        .where(
          and(
            eq(usageLog.userId, userId),
            gte(usageLog.createdAt, start),
            lte(usageLog.createdAt, end)
          )
        );

      let totalTokens = 0;
      let totalCost = 0;
      const modelDist: Record<string, number> = {};

      for (const log of usage) {
        totalTokens += log.totalTokens;
        totalCost += Number.parseFloat(log.cost || "0");
        modelDist[log.modelId] = (modelDist[log.modelId] || 0) + 1;
      }

      // Get deployments
      const deployments = await db
        .select({ count: count() })
        .from(deployment)
        .where(
          and(
            eq(deployment.deployedBy, userId),
            gte(deployment.createdAt, start),
            lte(deployment.createdAt, end)
          )
        );

      return {
        messageCount: messageEvents[0]?.count || 0,
        projectsCreated: projectsCreated[0]?.count || 0,
        linesOfCode: 0, // Would need to track this
        agentInvocations: usage.length,
        deploymentsCount: deployments[0]?.count || 0,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens,
          estimatedCost: totalCost,
        },
        modelDistribution: modelDist,
        peakUsageTimes: [],
        averageResponseTime: 0,
        conversationLengths: [],
        productivityScore: this.calculateProductivityScore({
          messageCount: messageEvents[0]?.count || 0,
          projectsCreated: projectsCreated[0]?.count || 0,
          deploymentsCount: deployments[0]?.count || 0,
        }),
      };
    } catch (error) {
      console.error("Get user stats error:", error);
      return this.getEmptyStats();
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(
    userId: string,
    period?: AnalyticsPeriod
  ): Promise<AgentPerformance[]> {
    try {
      const start = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = period?.end || new Date();

      // Get agent tasks
      const tasks = await db
        .select()
        .from(agentTask)
        .where(
          and(
            gte(agentTask.createdAt, start),
            lte(agentTask.createdAt, end)
          )
        );

      const agentStats: Record<string, any> = {};

      for (const task of tasks) {
        const role = task.type; // Using task type as role for now
        if (!agentStats[role]) {
          agentStats[role] = {
            tasksCompleted: 0,
            totalTime: 0,
            successCount: 0,
            totalCost: 0,
            tokenUsage: 0,
          };
        }

        agentStats[role].tasksCompleted++;
        if (task.status === "completed") {
          agentStats[role].successCount++;
        }

        if (task.completedAt && task.createdAt) {
          const duration =
            task.completedAt.getTime() - task.createdAt.getTime();
          agentStats[role].totalTime += duration;
        }
      }

      return Object.entries(agentStats).map(([role, stats]: [string, any]) => ({
        agentRole: role,
        tasksCompleted: stats.tasksCompleted,
        averageCompletionTime:
          stats.tasksCompleted > 0
            ? stats.totalTime / stats.tasksCompleted / 1000
            : 0,
        successRate:
          stats.tasksCompleted > 0
            ? (stats.successCount / stats.tasksCompleted) * 100
            : 0,
        totalCost: stats.totalCost,
        tokenUsage: stats.tokenUsage,
      }));
    } catch (error) {
      console.error("Get agent performance error:", error);
      return [];
    }
  }

  /**
   * Get code quality metrics
   */
  async getCodeQualityMetrics(
    userId: string,
    projectId?: string
  ): Promise<CodeQualityMetrics> {
    // Placeholder implementation
    return {
      bugFixRate: 0.85,
      codeReviewScore: 8.5,
      testCoverage: 75,
      maintainabilityIndex: 80,
      technicalDebt: 15,
    };
  }

  /**
   * Generate project report
   */
  async generateProjectReport(projectId: string): Promise<ProjectReport> {
    try {
      const [proj] = await db
        .select()
        .from(project)
        .where(eq(project.id, projectId))
        .limit(1);

      if (!proj) {
        throw new Error("Project not found");
      }

      // Get deployments
      const projectDeployments = await db
        .select({ count: count() })
        .from(deployment)
        .where(eq(deployment.projectId, projectId));

      // Get agent tasks
      const tasks = await db
        .select()
        .from(agentTask)
        .where(eq(agentTask.projectId, projectId));

      const agentsUsed = [...new Set(tasks.map((t) => t.type))];

      return {
        projectId: proj.id,
        projectName: proj.name,
        startDate: proj.createdAt,
        completionDate:
          proj.status === "completed" ? proj.updatedAt : undefined,
        linesOfCode: 0, // Would need to calculate
        filesCreated: 0, // Would need to track
        agentsUsed,
        totalCost: 0, // Would need to calculate
        timeSpent: 0, // Would need to track
        deploymentsCount: projectDeployments[0]?.count || 0,
        qualityScore: 85, // Would need to calculate
      };
    } catch (error) {
      console.error("Generate project report error:", error);
      throw new Error("Failed to generate project report");
    }
  }

  /**
   * Get chart data for analytics dashboard
   */
  async getChartData(
    userId: string,
    type: "messages" | "projects" | "tokens" | "cost",
    period: AnalyticsPeriod
  ): Promise<ChartData> {
    try {
      const days = Math.ceil(
        (period.end.getTime() - period.start.getTime()) / (24 * 60 * 60 * 1000)
      );

      const labels: string[] = [];
      const data: number[] = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(period.start);
        date.setDate(date.getDate() + i);
        labels.push(date.toLocaleDateString());
        data.push(Math.floor(Math.random() * 100)); // Placeholder data
      }

      return {
        labels,
        datasets: [
          {
            label: type.charAt(0).toUpperCase() + type.slice(1),
            data,
            backgroundColor: "rgba(139, 92, 246, 0.5)",
            borderColor: "rgba(139, 92, 246, 1)",
          },
        ],
      };
    } catch (error) {
      console.error("Get chart data error:", error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Export analytics data
   */
  async exportData(
    userId: string,
    format: "csv" | "json",
    period?: AnalyticsPeriod
  ): Promise<string> {
    try {
      const stats = await this.getUserStats(userId, period);
      const agentPerf = await this.getAgentPerformance(userId, period);

      if (format === "json") {
        return JSON.stringify(
          {
            stats,
            agentPerformance: agentPerf,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        );
      } else {
        // CSV format
        let csv = "Metric,Value\n";
        csv += `Messages,${stats.messageCount}\n`;
        csv += `Projects,${stats.projectsCreated}\n`;
        csv += `Deployments,${stats.deploymentsCount}\n`;
        csv += `Total Tokens,${stats.tokenUsage.totalTokens}\n`;
        csv += `Total Cost,$${stats.tokenUsage.estimatedCost.toFixed(2)}\n`;
        return csv;
      }
    } catch (error) {
      console.error("Export data error:", error);
      throw new Error("Failed to export data");
    }
  }

  // Private helper methods

  private calculateProductivityScore(data: {
    messageCount: number;
    projectsCreated: number;
    deploymentsCount: number;
  }): number {
    // Simple scoring algorithm
    const score =
      data.messageCount * 0.1 +
      data.projectsCreated * 10 +
      data.deploymentsCount * 20;

    return Math.min(100, Math.round(score));
  }

  private getEmptyStats(): UserStats {
    return {
      messageCount: 0,
      projectsCreated: 0,
      linesOfCode: 0,
      agentInvocations: 0,
      deploymentsCount: 0,
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
      },
      modelDistribution: {},
      peakUsageTimes: [],
      averageResponseTime: 0,
      conversationLengths: [],
      productivityScore: 0,
    };
  }
}

// Singleton instance
let analyticsServiceInstance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService();
  }
  return analyticsServiceInstance;
}
