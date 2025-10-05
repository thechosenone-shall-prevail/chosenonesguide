// Provider Registry and Model Catalog

import type { AIModel, AIProvider, ProviderClient } from "./types";
import { createOpenAIClient } from "./openai";
import { createAnthropicClient } from "./anthropic";
import { createGoogleAIClient } from "./google";

// Model Catalog with pricing and capabilities
export const MODEL_CATALOG: AIModel[] = [
  // OpenAI Models
  {
    id: "gpt-4",
    providerId: "openai",
    name: "GPT-4",
    description: "Most capable model for complex tasks",
    capabilities: [
      { type: "text", enabled: true },
      { type: "function-calling", enabled: true },
      { type: "reasoning", enabled: true },
      { type: "vision", enabled: false },
    ],
    pricing: {
      inputCostPer1kTokens: 0.03,
      outputCostPer1kTokens: 0.06,
      currency: "USD",
    },
    contextWindow: 8192,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
  },
  {
    id: "gpt-3.5-turbo",
    providerId: "openai",
    name: "GPT-3.5 Turbo",
    description: "Fast and cost-effective for simple tasks",
    capabilities: [
      { type: "text", enabled: true },
      { type: "function-calling", enabled: true },
      { type: "reasoning", enabled: false },
      { type: "vision", enabled: false },
    ],
    pricing: {
      inputCostPer1kTokens: 0.0015,
      outputCostPer1kTokens: 0.002,
      currency: "USD",
    },
    contextWindow: 16385,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
  },
  // Anthropic Models
  {
    id: "claude-opus",
    providerId: "anthropic",
    name: "Claude Opus",
    description: "Most powerful Claude model for complex tasks",
    capabilities: [
      { type: "text", enabled: true },
      { type: "reasoning", enabled: true },
      { type: "function-calling", enabled: false },
      { type: "vision", enabled: false },
    ],
    pricing: {
      inputCostPer1kTokens: 0.015,
      outputCostPer1kTokens: 0.075,
      currency: "USD",
    },
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: false,
  },
  {
    id: "claude-sonnet",
    providerId: "anthropic",
    name: "Claude Sonnet",
    description: "Balanced performance and cost",
    capabilities: [
      { type: "text", enabled: true },
      { type: "reasoning", enabled: true },
      { type: "function-calling", enabled: false },
      { type: "vision", enabled: false },
    ],
    pricing: {
      inputCostPer1kTokens: 0.003,
      outputCostPer1kTokens: 0.015,
      currency: "USD",
    },
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: false,
  },
  // Google AI Models
  {
    id: "gemini-pro",
    providerId: "google",
    name: "Gemini Pro",
    description: "Google's most capable model",
    capabilities: [
      { type: "text", enabled: true },
      { type: "reasoning", enabled: true },
      { type: "function-calling", enabled: true },
      { type: "vision", enabled: false },
    ],
    pricing: {
      inputCostPer1kTokens: 0.00025,
      outputCostPer1kTokens: 0.0005,
      currency: "USD",
    },
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
  },
  {
    id: "gemini-flash",
    providerId: "google",
    name: "Gemini Flash",
    description: "Fast and efficient for quick responses",
    capabilities: [
      { type: "text", enabled: true },
      { type: "reasoning", enabled: false },
      { type: "function-calling", enabled: true },
      { type: "vision", enabled: false },
    ],
    pricing: {
      inputCostPer1kTokens: 0.000125,
      outputCostPer1kTokens: 0.000375,
      currency: "USD",
    },
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
  },
];

// Provider Registry
export const PROVIDERS: Record<string, AIProvider> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    models: MODEL_CATALOG.filter((m) => m.providerId === "openai"),
    createClient: createOpenAIClient,
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    models: MODEL_CATALOG.filter((m) => m.providerId === "anthropic"),
    createClient: createAnthropicClient,
  },
  google: {
    id: "google",
    name: "Google AI",
    models: MODEL_CATALOG.filter((m) => m.providerId === "google"),
    createClient: createGoogleAIClient,
  },
};

// Helper functions
export function getModel(modelId: string): AIModel | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}

export function getProvider(providerId: string): AIProvider | undefined {
  return PROVIDERS[providerId];
}

export function createProviderClient(
  providerId: string,
  apiKey: string
): ProviderClient {
  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(`Provider ${providerId} not found`);
  }
  return provider.createClient(apiKey);
}

export function getModelsByProvider(providerId: string): AIModel[] {
  return MODEL_CATALOG.filter((m) => m.providerId === providerId);
}

export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const model = getModel(modelId);
  if (!model) return 0;

  const inputCost = (promptTokens / 1000) * model.pricing.inputCostPer1kTokens;
  const outputCost =
    (completionTokens / 1000) * model.pricing.outputCostPer1kTokens;

  return inputCost + outputCost;
}
