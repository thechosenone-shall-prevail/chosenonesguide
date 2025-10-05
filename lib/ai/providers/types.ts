// AI Provider Types and Interfaces

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  createClient: (apiKey: string) => ProviderClient;
}

export interface AIModel {
  id: string;
  providerId: string;
  name: string;
  description: string;
  capabilities: ModelCapability[];
  pricing: ModelPricing;
  contextWindow: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
}

export interface ModelCapability {
  type: "text" | "vision" | "function-calling" | "reasoning";
  enabled: boolean;
}

export interface ModelPricing {
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  currency: "INR" | "USD";
}

export interface ProviderClient {
  streamText: (params: StreamTextParams) => Promise<StreamResponse>;
  generateText: (params: GenerateTextParams) => Promise<TextResponse>;
}

export interface StreamTextParams {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GenerateTextParams {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamResponse {
  stream: ReadableStream;
  usage?: TokenUsage;
}

export interface TextResponse {
  text: string;
  usage: TokenUsage;
  finishReason: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ProviderError {
  code: string;
  message: string;
  provider: string;
  retryable: boolean;
}
