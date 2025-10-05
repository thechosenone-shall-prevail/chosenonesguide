// Agent-Model Mapping Configuration

import { AgentRole } from "./types";

export interface ModelMapping {
  primary: string;
  fallback: string;
  description: string;
}

export const AGENT_MODEL_MAP: Record<AgentRole, ModelMapping> = {
  [AgentRole.ARCHITECT]: {
    primary: "gpt-4",
    fallback: "claude-opus",
    description: "High-level design and architecture planning",
  },
  [AgentRole.CODER]: {
    primary: "claude-sonnet",
    fallback: "gpt-4",
    description: "Code implementation and refactoring",
  },
  [AgentRole.FRONTEND]: {
    primary: "claude-sonnet",
    fallback: "gpt-4",
    description: "UI/UX implementation and component building",
  },
  [AgentRole.BACKEND]: {
    primary: "gpt-4",
    fallback: "claude-sonnet",
    description: "API design, database schema, server logic",
  },
  [AgentRole.DEBUGGER]: {
    primary: "gpt-4",
    fallback: "claude-sonnet",
    description: "Error analysis and debugging",
  },
  [AgentRole.REVIEWER]: {
    primary: "gpt-4",
    fallback: "claude-opus",
    description: "Code review, best practices, security audit",
  },
  [AgentRole.DEVOPS]: {
    primary: "gpt-4",
    fallback: "claude-sonnet",
    description: "Deployment, CI/CD, infrastructure",
  },
  [AgentRole.TESTER]: {
    primary: "claude-sonnet",
    fallback: "gpt-4",
    description: "Test generation, QA, edge case identification",
  },
  [AgentRole.DOCUMENTATION]: {
    primary: "gpt-4",
    fallback: "claude-sonnet",
    description: "README, API docs, code comments",
  },
  [AgentRole.OPTIMIZER]: {
    primary: "claude-sonnet",
    fallback: "gpt-4",
    description: "Performance optimization and refactoring",
  },
};

export function getModelForAgent(role: AgentRole, useFallback = false): string {
  const mapping = AGENT_MODEL_MAP[role];
  return useFallback ? mapping.fallback : mapping.primary;
}

export function getAgentCapabilities(role: AgentRole): string[] {
  const capabilities: Record<AgentRole, string[]> = {
    [AgentRole.ARCHITECT]: [
      "system-design",
      "architecture-planning",
      "tech-stack-selection",
      "scalability-planning",
    ],
    [AgentRole.CODER]: [
      "code-implementation",
      "refactoring",
      "optimization",
      "bug-fixing",
    ],
    [AgentRole.FRONTEND]: [
      "ui-implementation",
      "component-building",
      "styling",
      "responsive-design",
    ],
    [AgentRole.BACKEND]: [
      "api-design",
      "database-schema",
      "server-logic",
      "authentication",
    ],
    [AgentRole.DEBUGGER]: [
      "error-analysis",
      "debugging",
      "troubleshooting",
      "log-analysis",
    ],
    [AgentRole.REVIEWER]: [
      "code-review",
      "best-practices",
      "security-audit",
      "performance-review",
    ],
    [AgentRole.DEVOPS]: [
      "deployment",
      "ci-cd",
      "infrastructure",
      "monitoring",
    ],
    [AgentRole.TESTER]: [
      "test-generation",
      "qa",
      "edge-case-identification",
      "test-automation",
    ],
    [AgentRole.DOCUMENTATION]: [
      "readme-writing",
      "api-documentation",
      "code-comments",
      "user-guides",
    ],
    [AgentRole.OPTIMIZER]: [
      "performance-optimization",
      "code-refactoring",
      "memory-optimization",
      "query-optimization",
    ],
  };

  return capabilities[role] || [];
}
