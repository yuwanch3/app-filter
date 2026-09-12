export interface AppConfig {
  autoBlur: boolean;
  requirePinForOverride: boolean;
  overridePin: string;
  moderationApi: 'local' | 'cloud';
  enableKeywordFilter: boolean;
  enableImageModeration: boolean;
  enableNotification: boolean;
  monitoredApps: string[];
}

export interface FilteredContent {
  id: string;
  timestamp: number;
  platform: string;
  contentType: 'search' | 'feed' | 'comment';
  reason: 'keyword' | 'image' | 'video';
  matchedKeyword?: string;
  confidence?: number;
  action: 'blurred' | 'hidden' | 'reported' | 'blocked' | 'dismissed';
  sourceText?: string;
}

export interface ModerationResult {
  isSensitive: boolean;
  confidence: number;
  categories: string[];
  reason?: string;
}

export interface KeywordEntry {
  id: string;
  keyword: string;
  category: 'pornography' | 'violence' | 'hate_speech' | 'custom';
  isActive: boolean;
  createdAt: number;
}

export interface AccessibilityEvent {
  type: 'text' | 'image' | 'node_change';
  packageName: string;
  text?: string;
  nodeId?: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface WhitelistedApp {
  packageName: string;
  displayName: string;
  enabled: boolean;
}

export const MONITORED_APPS: WhitelistedApp[] = [
  { packageName: 'com.google.android.youtube', displayName: 'YouTube', enabled: true },
  { packageName: 'com.instagram.android', displayName: 'Instagram', enabled: false },
  { packageName: 'com.zhiliaoapp.musically', displayName: 'TikTok', enabled: false },
  { packageName: 'com.twitter.android', displayName: 'X (Twitter)', enabled: false },
];

export const DEFAULT_KEYWORDS: string[] = [
  'porn', 'porno', 'pornografi', 'xxx', 'sex', 'seks',
  'dewasa 18+', '18+', 'nsfw', 'bokep', 'viral bokep',
  'bugil', 'telanjang', 'nude', 'naked', 'sexy',
  'hot video', 'hot girl', 'hot model',
];