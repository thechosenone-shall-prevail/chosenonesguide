// Model Fallback Strategy

import type { GenerateTextParams, ProviderClient, TextResponse } from "./types";
import { createProviderClient, getModel } from "./index";

export interface FallbackConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackModels: string[];
}

export class ModelFallbackHandler {
  private config: FallbackConfig;

  constructor(config?: Partial<FallbackConfig>) {
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      retryDelay: config?.retryDelay ?? 1000,
      fallbackModels: config?.fallbackModels ?? [],
    };
  }

  async generateWithFallback(
    params: GenerateTextParams,
    apiKeys: Record<string, string>
  ): Promise<TextResponse> {
    const modelsToTry = [params.model, ...this.config.fallbackModels];
    let lastError: Error | null = null;

    for (const modelId of modelsToTry) {
      const model = getModel(modelId);
      if (!model) {
        console.warn(`Model ${modelId} not found in catalog`);
        continue;
      }

      const apiKey = apiKeys[model.providerId];
      if (!apiKey) {
        console.warn(`No API key found for provider ${model.providerId}`);
        continue;
      }

      try {
        const client = createProviderClient(model.providerId, apiKey);
        const response = await this.retryWithBackoff(
          () => client.generateText({ ...params, model: modelId }),
          this.config.maxRetries,
          this.config.retryDelay
        );

        console.log(`Successfully generated text using model: ${modelId}`);
        return response;
      } catch (error) {
        console.error(`Failed to generate with model ${modelId}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    throw new Error(
      `All models failed. Last error: ${lastError?.message || "Unknown error"}`
    );
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delay: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          // Exponential backoff
          const backoffDelay = delay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }
}

// Singleton instance
let fallbackHandlerInstance: ModelFallbackHandler | null = null;

export function getFallbackHandler(
  config?: Partial<FallbackConfig>
): ModelFallbackHandler {
  if (!fallbackHandlerInstance) {
    fallbackHandlerInstance = new ModelFallbackHandler(config);
  }
  return fallbackHandlerInstance;
}
