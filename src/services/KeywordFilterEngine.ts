import { DEFAULT_KEYWORDS } from '../types';
import type { KeywordEntry } from '../types';

export class KeywordFilterEngine {
  private keywords: Set<string> = new Set();

  constructor() {
    this.loadDefaults();
  }

  private loadDefaults() {
    DEFAULT_KEYWORDS.forEach(kw => this.keywords.add(kw.toLowerCase()));
  }

  setKeywords(keywords: string[]) {
    this.keywords = new Set(keywords.map(k => k.toLowerCase().trim()));
  }

  addKeyword(keyword: string) {
    this.keywords.add(keyword.toLowerCase().trim());
  }

  removeKeyword(keyword: string) {
    this.keywords.delete(keyword.toLowerCase().trim());
  }

  getKeywords(): string[] {
    return [...this.keywords];
  }

  matches(text: string): boolean {
    const lower = text.toLowerCase();
    for (const keyword of this.keywords) {
      if (lower.includes(keyword)) return true;
    }
    return false;
  }

  findMatchedKeywords(text: string): string[] {
    const lower = text.toLowerCase();
    return [...this.keywords].filter(kw => lower.includes(kw));
  }

  highlightText(text: string): { segments: Array<{ text: string; isMatch: boolean }> } {
    const lower = text.toLowerCase();
    const matchedKeyword = [...this.keywords].find(kw => lower.includes(kw));

    if (!matchedKeyword) {
      return { segments: [{ text, isMatch: false }] };
    }

    const segments: Array<{ text: string; isMatch: boolean }> = [];
    const idx = lower.indexOf(matchedKeyword);

    if (idx > 0) {
      segments.push({ text: text.slice(0, idx), isMatch: false });
    }
    segments.push({ text: text.slice(idx, idx + matchedKeyword.length), isMatch: true });
    if (idx + matchedKeyword.length < text.length) {
      segments.push({ text: text.slice(idx + matchedKeyword.length), isMatch: false });
    }

    return { segments };
  }

  get keywordCount(): number {
    return this.keywords.size;
  }
}

export const keywordEngine = new KeywordFilterEngine();