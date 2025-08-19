import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2StreamPart,
  LanguageModelV2Usage,
  SharedV2ProviderMetadata,
} from '@ai-sdk/provider';

interface MockSettings {
  modelId?: string;
  provider?: string;
  doGenerate?: (options: LanguageModelV2CallOptions) => PromiseLike<{
    content: LanguageModelV2Content[];
    finishReason: LanguageModelV2FinishReason;
    usage: LanguageModelV2Usage;
    providerMetadata?: SharedV2ProviderMetadata;
    request?: { body?: unknown };
    response?: {
      headers?: Record<string, string>;
      id?: string;
      timestamp?: Date;
      modelId?: string;
    };
    warnings: LanguageModelV2CallWarning[];
  }>;
  doStream?: (options: LanguageModelV2CallOptions) => PromiseLike<{
    stream: ReadableStream<LanguageModelV2StreamPart>;
    request?: { body?: unknown };
    response?: { headers?: Record<string, string> };
  }>;
}

export class MockLanguageModelV2 implements LanguageModelV2 {
  readonly specificationVersion = 'v2' as const;
  readonly modelId: string;
  readonly provider: string;
  readonly supportedUrls: Record<string, RegExp[]> = {};

  private settings: MockSettings;

  constructor(settings: MockSettings = {}) {
    this.settings = settings;
    this.modelId = settings.modelId ?? 'mock-model';
    this.provider = settings.provider ?? 'mock-provider';
  }

  async doGenerate(options: LanguageModelV2CallOptions) {
    if (this.settings.doGenerate) {
      return this.settings.doGenerate(options);
    }

    return {
      content: [{ type: 'text' as const, text: 'mock response' }],
      finishReason: 'stop' as LanguageModelV2FinishReason,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
      rawCall: { rawPrompt: '', rawSettings: {} },
    };
  }

  async doStream(options: LanguageModelV2CallOptions) {
    if (this.settings.doStream) {
      return this.settings.doStream(options);
    }

    const stream = new ReadableStream<LanguageModelV2StreamPart>({
      start(controller) {
        controller.enqueue({ type: 'stream-start', warnings: [] });
        controller.enqueue({
          type: 'text-delta',
          id: 'mock-id',
          delta: 'mock stream response',
        });
        controller.enqueue({
          type: 'finish',
          finishReason: 'stop',
          usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        });
        controller.close();
      },
    });

    return {
      stream,
      rawCall: { rawPrompt: '', rawSettings: {} },
    };
  }
}
