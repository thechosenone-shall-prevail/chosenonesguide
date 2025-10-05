// Analytics Types

export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  createdAt: Date;
}

export interface UserStats {
  messageCount: number;
  projectsCreated: number;
  linesOfCode: number;
  agentInvocations: number;
  deploymentsCount: number;
  tokenUsage: TokenUsage;
  modelDistribution: Record<string, number>;
  peakUsageTimes: TimeDistribution[];
  averageResponseTime: number;
  conversationLengths: number[];
  productivityScore: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface TimeDistribution {
  hour: number;
  count: number;
}

export interface AgentPerformance {
  agentRole: string;
  tasksCompleted: number;
  averageCompletionTime: number;
  successRate: number;
  totalCost: number;
  tokenUsage: number;
}

export interface CodeQualityMetrics {
  bugFixRate: number;
  codeReviewScore: number;
  testCoverage: number;
  maintainabilityIndex: number;
  technicalDebt: number;
}

export interface ProjectReport {
  projectId: string;
  projectName: string;
  startDate: Date;
  completionDate?: Date;
  linesOfCode: number;
  filesCreated: number;
  agentsUsed: string[];
  totalCost: number;
  timeSpent: number;
  deploymentsCount: number;
  qualityScore: number;
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
}
