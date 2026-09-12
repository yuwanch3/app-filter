import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFilterHistory, clearAllHistory } from '../services/DatabaseService';
import type { FilteredContent } from '../types';

const PLATFORM_NAMES: Record<string, string> = {
  'com.google.android.youtube': 'YouTube',
  'com.instagram.android': 'Instagram',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.twitter.android': 'X (Twitter)',
};

const ACTION_EMOJIS: Record<string, string> = {
  blurred: '🔒',
  hidden: '🙈',
  reported: '🚨',
  blocked: '🚫',
  dismissed: '⏭',
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<FilteredContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getFilterHistory(100);
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Hapus Riwayat',
      'Hapus semua riwayat konten yang difilter? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            await clearAllHistory();
            setHistory([]);
          },
        },
      ],
    );
  }, []);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  };

  const renderItem = ({ item }: { item: FilteredContent }) => (
    <View style={styles.historyRow}>
      <View style={styles.historyHeader}>
        <Text style={styles.actionEmoji}>{ACTION_EMOJIS[item.action] || '🔒'}</Text>
        <Text style={styles.platformText}>
          {PLATFORM_NAMES[item.platform] || item.platform}
        </Text>
        <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
      </View>
      <View style={styles.historyBody}>
        <View style={styles.badgeRow}>
          <View style={styles.reasonBadge}>
            <Text style={styles.reasonText}>
              {item.reason === 'keyword' ? 'Kata Kunci' : item.reason === 'image' ? 'Gambar' : 'Video'}
            </Text>
          </View>
          {item.matchedKeyword && (
            <View style={styles.keywordBadge}>
              <Text style={styles.keywordBadgeText}>{item.matchedKeyword}</Text>
            </View>
          )}
        </View>
        {item.sourceText && (
          <Text style={styles.sourceText} numberOfLines={2}>
            {item.sourceText}
          </Text>
        )}
        {item.confidence && (
          <Text style={styles.confidenceText}>
            Confidence: {Math.round(item.confidence * 100)}%
          </Text>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛡️</Text>
          <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
          <Text style={styles.emptyText}>
            Konten yang difilter akan muncul di sini
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              Total: {history.length} konten
            </Text>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Hapus Riwayat</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  clearBtn: {
    backgroundColor: '#450a0a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  historyRow: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  platformText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
  },
  historyBody: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  reasonBadge: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reasonText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '500',
  },
  keywordBadge: {
    backgroundColor: '#5b2133',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  keywordBadgeText: {
    color: '#f472b6',
    fontSize: 11,
    fontWeight: '500',
  },
  sourceText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  confidenceText: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});