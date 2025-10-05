// Agent Types and Interfaces

export enum AgentRole {
  ARCHITECT = "architect",
  CODER = "coder",
  FRONTEND = "frontend",
  BACKEND = "backend",
  DEBUGGER = "debugger",
  REVIEWER = "reviewer",
  DEVOPS = "devops",
  TESTER = "tester",
  DOCUMENTATION = "documentation",
  OPTIMIZER = "optimizer",
}

export type AgentStatus = "idle" | "thinking" | "coding" | "reviewing" | "blocked";

export interface Agent {
  id: string;
  role: AgentRole;
  model: string;
  status: AgentStatus;
  currentTask?: DevelopmentTask;
  capabilities: string[];
}

export interface DevelopmentTask {
  id: string;
  type: "design" | "implement" | "debug" | "review" | "deploy" | "optimize";
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  assignedAgents: string[];
  dependencies: string[];
  status: "pending" | "in_progress" | "completed" | "blocked";
}

export interface AgentAssignment {
  taskId: string;
  primaryAgent: Agent;
  supportingAgents: Agent[];
  estimatedTime: number;
  reasoning: string;
}

export interface AgentTeam {
  projectId: string;
  agents: Agent[];
  createdAt: Date;
}

export interface AgentConflict {
  taskId: string;
  conflictingAgents: Agent[];
  issue: string;
}

export interface Resolution {
  taskId: string;
  selectedAgent: Agent;
  reasoning: string;
}

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent?: string;
  content: string;
  type: "task-assignment" | "status-update" | "collaboration" | "handoff";
  timestamp: Date;
}
