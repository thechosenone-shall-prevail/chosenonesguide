// Anthropic Provider Adapter

import Anthropic from "@anthropic-ai/sdk";
import type {
  GenerateTextParams,
  ProviderClient,
  StreamResponse,
  StreamTextParams,
  TextResponse,
} from "./types";

export class AnthropicProvider implements ProviderClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async streamText(params: StreamTextParams): Promise<StreamResponse> {
    try {
      const stream = await this.client.messages.create({
        model: params.model,
        messages: params.messages.map((msg) => ({
          role: msg.role === "system" ? "user" : msg.role,
          content: msg.content,
        })),
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 4096,
        stream: true,
      });

      // Convert Anthropic stream to ReadableStream
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta"
              ) {
                const content = chunk.delta.text;
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
      const response = await this.client.messages.create({
        model: params.model,
        messages: params.messages.map((msg) => ({
          role: msg.role === "system" ? "user" : msg.role,
          content: msg.content,
        })),
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 4096,
      });

      const textContent = response.content.find((c) => c.type === "text");

      return {
        text: textContent && textContent.type === "text" ? textContent.text : "",
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason || "stop",
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Anthropic.APIError) {
      return new Error(`Anthropic API Error: ${error.message}`);
    }
    return error as Error;
  }
}

export function createAnthropicClient(apiKey: string): ProviderClient {
  return new AnthropicProvider(apiKey);
}
