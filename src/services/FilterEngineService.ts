import { nativeBridge } from '../native/NativeBridge';
import { keywordEngine } from './KeywordFilterEngine';
import { moderationService } from './ModerationService';
import type { FilteredContent, AccessibilityEvent } from '../types';
import { insertFilterHistory, getFilteredCountToday } from './DatabaseService';

type FilterHandler = (entry: FilteredContent) => void;

class FilterEngineService {
  private handlers: Set<FilterHandler> = new Set();
  private isEnabled = true;
  private appFilterActive = false;

  constructor() {
    this.setupNativeListeners();
  }

  private setupNativeListeners() {
    nativeBridge.addEventListener('keyword_match', (event: AccessibilityEvent) => {
      if (!this.isEnabled) return;

      const entry: FilteredContent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        platform: event.packageName || 'unknown',
        contentType: 'feed',
        reason: 'keyword',
        matchedKeyword: event.matchedKeyword,
        action: 'blurred',
        sourceText: event.text,
      };

      this.notifyHandlers(entry);
      this.saveEntry(entry);
    });
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isActive(): boolean {
    return this.appFilterActive;
  }

  async processText(text: string, platform: string): Promise<FilteredContent | null> {
    if (!this.isEnabled) return null;

    if (keywordEngine.matches(text)) {
      const entry: FilteredContent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        platform,
        contentType: 'search',
        reason: 'keyword',
        matchedKeyword: keywordEngine.findMatchedKeywords(text)[0],
        action: 'hidden',
        sourceText: text,
      };

      this.notifyHandlers(entry);
      await this.saveEntry(entry);
      return entry;
    }

    const moderationResult = await moderationService.moderateText(text);
    if (moderationResult.isSensitive) {
      const entry: FilteredContent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        platform,
        contentType: 'feed',
        reason: moderationService.activeApiType === 'local' ? 'keyword' : 'image',
        confidence: moderationResult.confidence,
        action: 'blurred',
        sourceText: text,
      };

      this.notifyHandlers(entry);
      await this.saveEntry(entry);
      return entry;
    }

    return null;
  }

  onFiltered(handler: FilterHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private notifyHandlers(entry: FilteredContent) {
    this.handlers.forEach(handler => handler(entry));
  }

  private async saveEntry(entry: FilteredContent) {
    try {
      await insertFilterHistory(entry);
    } catch (error) {
      console.warn('Failed to save filter history:', error);
    }
  }

  async getFilteredCountToday(): Promise<number> {
    try {
      return await getFilteredCountToday();
    } catch {
      return 0;
    }
  }
}

export const filterEngine = new FilterEngineService();