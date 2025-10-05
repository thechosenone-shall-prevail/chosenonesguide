// OpenAI Provider Adapter

import OpenAI from "openai";
import type {
  GenerateTextParams,
  ProviderClient,
  StreamResponse,
  StreamTextParams,
  TextResponse,
} from "./types";

export class OpenAIProvider implements ProviderClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async streamText(params: StreamTextParams): Promise<StreamResponse> {
    try {
      const stream = await this.client.chat.completions.create({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens,
        stream: true,
      });

      // Convert OpenAI stream to ReadableStream
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return {
        stream: readableStream,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateText(params: GenerateTextParams): Promise<TextResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens,
      });

      return {
        text: response.choices[0]?.message?.content || "",
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: response.choices[0]?.finish_reason || "stop",
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      return new Error(`OpenAI API Error: ${error.message}`);
    }
    return error as Error;
  }
}

export function createOpenAIClient(apiKey: string): ProviderClient {
  return new OpenAIProvider(apiKey);
}
