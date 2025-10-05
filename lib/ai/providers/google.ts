// Google AI Provider Adapter

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  GenerateTextParams,
  ProviderClient,
  StreamResponse,
  StreamTextParams,
  TextResponse,
} from "./types";

export class GoogleAIProvider implements ProviderClient {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async streamText(params: StreamTextParams): Promise<StreamResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: params.model });

      // Convert messages to Gemini format
      const prompt = params.messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const result = await model.generateContentStream(prompt);

      // Convert Gemini stream to ReadableStream
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const content = chunk.text();
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
      const model = this.client.getGenerativeModel({ model: params.model });

      // Convert messages to Gemini format
      const prompt = params.messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return {
        text,
        usage: {
          promptTokens: 0, // Gemini doesn't provide token counts in the same way
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: "stop",
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return new Error(`Google AI Error: ${error.message}`);
    }
    return new Error("Unknown Google AI error");
  }
}

export function createGoogleAIClient(apiKey: string): ProviderClient {
  return new GoogleAIProvider(apiKey);
}
