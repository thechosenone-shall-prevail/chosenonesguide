// Agent Coordinator - Orchestrates multiple AI agents

import crypto from "node:crypto";
import {
  Agent,
  AgentAssignment,
  AgentConflict,
  AgentRole,
  AgentTeam,
  DevelopmentTask,
  Resolution,
} from "./types";
import { getAgentCapabilities, getModelForAgent } from "./model-mapping";

export class AgentCoordinator {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, DevelopmentTask> = new Map();

  /**
   * Initialize a team of AI agents for a project
   */
  async initializeAgents(projectId: string): Promise<AgentTeam> {
    const agentRoles = Object.values(AgentRole);
    const agents: Agent[] = [];

    for (const role of agentRoles) {
      const agent: Agent = {
        id: crypto.randomUUID(),
        role,
        model: getModelForAgent(role),
        status: "idle",
        capabilities: getAgentCapabilities(role),
      };

      this.agents.set(agent.id, agent);
      agents.push(agent);
    }

    return {
      projectId,
      agents,
      createdAt: new Date(),
    };
  }

  /**
   * Assign a task to the most appropriate agent(s)
   */
  async assignTask(task: DevelopmentTask): Promise<AgentAssignment> {
    // Store the task
    this.tasks.set(task.id, task);

    // Determine the best agent for this task type
    const primaryAgent = this.selectPrimaryAgent(task);
    const supportingAgents = this.selectSupportingAgents(task, primaryAgent);

    // Update agent status
    if (primaryAgent) {
      primaryAgent.status = "thinking";
      primaryAgent.currentTask = task;
      this.agents.set(primaryAgent.id, primaryAgent);
    }

    // Estimate time based on task complexity
    const estimatedTime = this.estimateTaskTime(task);

    return {
      taskId: task.id,
      primaryAgent: primaryAgent!,
      supportingAgents,
      estimatedTime,
      reasoning: this.generateAssignmentReasoning(task, primaryAgent!),
    };
  }

  /**
   * Coordinate multiple agents working on a task
   */
  async coordinateAgents(
    agents: Agent[],
    task: DevelopmentTask
  ): Promise<void> {
    // Update task status
    task.status = "in_progress";
    task.assignedAgents = agents.map((a) => a.id);
    this.tasks.set(task.id, task);

    // Update all agent statuses
    for (const agent of agents) {
      agent.status = "thinking";
      agent.currentTask = task;
      this.agents.set(agent.id, agent);
    }

    // In a real implementation, this would:
    // 1. Set up communication channels between agents
    // 2. Monitor progress
    // 3. Handle handoffs
    // 4. Resolve conflicts
  }

  /**
   * Handle conflicts between agents
   */
  async handleAgentConflict(conflict: AgentConflict): Promise<Resolution> {
    // Simple resolution: pick the agent with the most relevant capabilities
    const task = this.tasks.get(conflict.taskId);
    if (!task) {
      throw new Error(`Task ${conflict.taskId} not found`);
    }

    const selectedAgent = this.selectPrimaryAgent(task);

    return {
      taskId: conflict.taskId,
      selectedAgent: selectedAgent!,
      reasoning: `Selected ${selectedAgent?.role} based on task requirements`,
    };
  }

  /**
   * Get the current status of an agent
   */
  async getAgentStatus(agentId: string): Promise<Agent | undefined> {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Update agent status
   */
  updateAgentStatus(
    agentId: string,
    status: Agent["status"],
    task?: DevelopmentTask
  ): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.currentTask = task;
      this.agents.set(agentId, agent);
    }
  }

  // Private helper methods

  private selectPrimaryAgent(task: DevelopmentTask): Agent | undefined {
    const roleMapping: Record<DevelopmentTask["type"], AgentRole> = {
      design: AgentRole.ARCHITECT,
      implement: AgentRole.CODER,
      debug: AgentRole.DEBUGGER,
      review: AgentRole.REVIEWER,
      deploy: AgentRole.DEVOPS,
      optimize: AgentRole.OPTIMIZER,
    };

    const targetRole = roleMapping[task.type];
    return Array.from(this.agents.values()).find(
      (agent) => agent.role === targetRole && agent.status === "idle"
    );
  }

  private selectSupportingAgents(
    task: DevelopmentTask,
    primaryAgent: Agent | undefined
  ): Agent[] {
    // For complex tasks, assign supporting agents
    const supportingAgents: Agent[] = [];

    if (task.priority === "critical" || task.priority === "high") {
      // Add reviewer for high-priority tasks
      const reviewer = Array.from(this.agents.values()).find(
        (agent) =>
          agent.role === AgentRole.REVIEWER &&
          agent.id !== primaryAgent?.id &&
          agent.status === "idle"
      );
      if (reviewer) supportingAgents.push(reviewer);
    }

    return supportingAgents;
  }

  private estimateTaskTime(task: DevelopmentTask): number {
    // Simple estimation based on task type and priority
    const baseTime: Record<DevelopmentTask["type"], number> = {
      design: 30,
      implement: 60,
      debug: 20,
      review: 15,
      deploy: 10,
      optimize: 45,
    };

    const priorityMultiplier: Record<DevelopmentTask["priority"], number> = {
      low: 0.8,
      medium: 1.0,
      high: 1.3,
      critical: 1.5,
    };

    return baseTime[task.type] * priorityMultiplier[task.priority];
  }

  private generateAssignmentReasoning(
    task: DevelopmentTask,
    agent: Agent
  ): string {
    return `Assigned ${agent.role} agent using ${agent.model} for ${task.type} task. Agent has capabilities: ${agent.capabilities.join(", ")}`;
  }
}

// Singleton instance
let coordinatorInstance: AgentCoordinator | null = null;

export function getAgentCoordinator(): AgentCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new AgentCoordinator();
  }
  return coordinatorInstance;
}
