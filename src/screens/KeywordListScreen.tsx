import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeywords } from '../hooks';
import { keywordEngine } from '../services/KeywordFilterEngine';
import { nativeBridge } from '../native/NativeBridge';
import { getAllKeywords, insertKeyword, deleteKeyword } from '../services/DatabaseService';
import { DEFAULT_KEYWORDS } from '../types';
import type { KeywordEntry } from '../types';

export default function KeywordListScreen() {
  const { keywords, isLoading, reload } = useKeywords();
  const [newKeyword, setNewKeyword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredKeywords = keywords.filter(k => {
    if (filter === 'active') return k.isActive;
    if (filter === 'inactive') return !k.isActive;
    return true;
  });

  const handleAdd = useCallback(async () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed) return;

    if (keywords.some(k => k.keyword === trimmed)) {
      Alert.alert('Sudah Ada', `Kata kunci "${trimmed}" sudah ada.`);
      return;
    }

    setIsAdding(true);
    try {
      const entry: KeywordEntry = {
        id: `${Date.now()}`,
        keyword: trimmed,
        category: 'custom',
        isActive: true,
        createdAt: Date.now(),
      };

      await insertKeyword(entry);
      keywordEngine.addKeyword(trimmed);
      await nativeBridge.updateKeywords(keywordEngine.getKeywords());
      setNewKeyword('');
      reload();
    } catch (error) {
      Alert.alert('Error', 'Gagal menambah kata kunci');
    } finally {
      setIsAdding(false);
    }
  }, [newKeyword, keywords, reload]);

  const handleDelete = useCallback(async (id: string, keyword: string) => {
    Alert.alert(
      'Hapus Kata Kunci',
      `Hapus "${keyword}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteKeyword(id);
            keywordEngine.removeKeyword(keyword);
            await nativeBridge.updateKeywords(keywordEngine.getKeywords());
            reload();
          },
        },
      ],
    );
  }, [reload]);

  const handleResetDefaults = useCallback(() => {
    Alert.alert(
      'Reset Default',
      'Kembalikan ke daftar kata kunci default? Kata kunci kustom akan dihapus.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            for (const kw of keywords) {
              await deleteKeyword(kw.id);
            }
            keywordEngine.setKeywords(DEFAULT_KEYWORDS);
            for (const kw of DEFAULT_KEYWORDS) {
              await insertKeyword({
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                keyword: kw,
                category: 'custom',
                isActive: true,
                createdAt: Date.now(),
              });
            }
            await nativeBridge.updateKeywords(DEFAULT_KEYWORDS);
            reload();
          },
        },
      ],
    );
  }, [keywords, reload]);

  const renderItem = ({ item }: { item: KeywordEntry }) => (
    <View style={styles.keywordRow}>
      <View style={styles.keywordInfo}>
        <Text style={styles.keywordText}>{item.keyword}</Text>
        <Text style={styles.keywordMeta}>
          {item.category} · {item.isActive ? 'Aktif' : 'Nonaktif'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, item.keyword)}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
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
      {/* Add new keyword */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={newKeyword}
          onChangeText={setNewKeyword}
          placeholder="Tambah kata kunci baru..."
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.addBtn, !newKeyword.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!newKeyword.trim() || isAdding}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addBtnText}>+</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetDefaults}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {filteredKeywords.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Belum Ada Kata Kunci</Text>
          <Text style={styles.emptyText}>
            Tambahkan kata kunci untuk mulai memfilter konten
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredKeywords}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Text style={styles.countText}>
        Total: {keywords.length} kata kunci
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  addRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#334155',
  },
  addBtn: {
    backgroundColor: '#6366f1',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resetBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  keywordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  keywordInfo: {
    flex: 1,
  },
  keywordText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f1f5f9',
  },
  keywordMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#450a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  countText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 13,
    padding: 16,
  },
});