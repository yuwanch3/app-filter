import type { ModerationResult } from '../types';

type ModerationApiType = 'local' | 'cloud';

interface ModerationApiConfig {
  type: ModerationApiType;
  endpoint?: string;
  apiKey?: string;
}

class ModerationService {
  private config: ModerationApiConfig = { type: 'local' };

  configure(config: ModerationApiConfig) {
    this.config = config;
  }

  async moderateText(text: string): Promise<ModerationResult> {
    if (this.config.type === 'local') {
      return this.localModeration(text);
    }
    return this.cloudModeration(text);
  }

  private async localModeration(text: string): Promise<ModerationResult> {
    const sensitivePatterns = [
      /\b(?:porn|porno|xxx|sex|seks|nsfw|bokep)\b/i,
      /\b(?:bugil|telanjang|nude|naked)\b/i,
      /\b(?:18\+|dewasa)\b/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(text)) {
        return {
          isSensitive: true,
          confidence: 0.85,
          categories: ['suggestive'],
          reason: 'Mengandung kata kunci sensitif',
        };
      }
    }

    return {
      isSensitive: false,
      confidence: 0.99,
      categories: [],
    };
  }

  private async cloudModeration(text: string): Promise<ModerationResult> {
    try {
      const response = await fetch(this.config.endpoint || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data as ModerationResult;
    } catch (error) {
      console.warn('Cloud moderation failed, falling back to local:', error);
      return this.localModeration(text);
    }
  }

  get activeApiType(): ModerationApiType {
    return this.config.type;
  }
}

export const moderationService = new ModerationService();