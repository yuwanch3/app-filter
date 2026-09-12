import * as SQLite from 'expo-sqlite';
import type { FilteredContent, AppConfig, KeywordEntry } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('appfilter.db');
    await initTables();
  }
  return db;
}

async function initTables() {
  if (!db) return;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS keywords (
      id TEXT PRIMARY KEY,
      keyword TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL DEFAULT 'custom',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS filter_history (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      platform TEXT NOT NULL,
      content_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      matched_keyword TEXT,
      confidence REAL,
      action TEXT NOT NULL,
      source_text TEXT
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_accounts (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      account_id TEXT NOT NULL,
      display_name TEXT,
      blocked_at INTEGER NOT NULL,
      UNIQUE(platform, account_id)
    );
  `);
}

export async function insertKeyword(keyword: KeywordEntry): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO keywords (id, keyword, category, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
    [keyword.id, keyword.keyword, keyword.category, keyword.isActive ? 1 : 0, keyword.createdAt],
  );
}

export async function deleteKeyword(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM keywords WHERE id = ?', [id]);
}

export async function getAllKeywords(): Promise<KeywordEntry[]> {
  const database = await getDb();
  const rows = await database.getAllAsync(
    'SELECT * FROM keywords ORDER BY created_at DESC',
  ) as any[];
  return rows.map((row: any) => ({
    id: row.id,
    keyword: row.keyword,
    category: row.category,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  }));
}

export async function insertFilterHistory(entry: FilteredContent): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO filter_history 
     (id, timestamp, platform, content_type, reason, matched_keyword, confidence, action, source_text) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id, entry.timestamp, entry.platform,
      entry.contentType, entry.reason, entry.matchedKeyword || null,
      entry.confidence || null, entry.action, entry.sourceText || null,
    ],
  );
}

export async function getFilterHistory(limit = 100): Promise<FilteredContent[]> {
  const database = await getDb();
  const rows = await database.getAllAsync(
    'SELECT * FROM filter_history ORDER BY timestamp DESC LIMIT ?',
    [limit],
  ) as any[];
  return rows.map((row: any) => ({
    id: row.id,
    timestamp: row.timestamp,
    platform: row.platform,
    contentType: row.content_type,
    reason: row.reason,
    matchedKeyword: row.matched_keyword,
    confidence: row.confidence,
    action: row.action,
    sourceText: row.source_text,
  }));
}

export async function getFilteredCountToday(): Promise<number> {
  const database = await getDb();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const result = await database.getFirstAsync(
    'SELECT COUNT(*) as count FROM filter_history WHERE timestamp >= ?',
    [todayStart.getTime()],
  ) as any;
  return result?.count || 0;
}

export async function saveConfig(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
    [key, value],
  );
}

export async function getConfig(key: string): Promise<string | null> {
  const database = await getDb();
  const result = await database.getFirstAsync(
    'SELECT value FROM config WHERE key = ?',
    [key],
  ) as any;
  return result?.value || null;
}

export async function clearAllHistory(): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM filter_history');
}

export async function saveBlockedAccount(
  platform: string,
  accountId: string,
  displayName?: string,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO blocked_accounts (id, platform, account_id, display_name, blocked_at)
     VALUES (?, ?, ?, ?, ?)`,
    [`${platform}_${accountId}`, platform, accountId, displayName || null, Date.now()],
  );
}