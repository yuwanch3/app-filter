import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../context/AppContext';
import { useAccessibilityService, useFilterStats } from '../hooks';
import { nativeBridge } from '../native/NativeBridge';
import { filterEngine } from '../services/FilterEngineService';
import { MONITORED_APPS } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type DashboardNavProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: { navigation: DashboardNavProp }) {
  const { state, dispatch } = useAppState();
  const { isEnabled, checkStatus } = useAccessibilityService();
  const { todayCount } = useFilterStats();

  useEffect(() => {
    filterEngine.onFiltered(() => {
      dispatch({ type: 'INCREMENT_FILTERED' });
    });
  }, []);

  const toggleService = useCallback(async () => {
    if (!isEnabled) {
      await nativeBridge.openAccessibilitySettings();
    } else {
      dispatch({ type: 'SET_SERVICE_ENABLED', payload: !state.serviceEnabled });
      filterEngine.setEnabled(!state.serviceEnabled);
    }
  }, [isEnabled, state.serviceEnabled]);

  const onRefresh = useCallback(async () => {
    await checkStatus();
  }, [checkStatus]);

  const activeApps = MONITORED_APPS.filter(a => a.enabled);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, isEnabled && styles.statusCardActive]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isEnabled ? styles.dotActive : styles.dotInactive]} />
            <Text style={styles.statusText}>
              {isEnabled ? (state.serviceEnabled ? 'Aktif' : 'Terhubung') : 'Tidak Aktif'}
            </Text>
          </View>
          <Text style={styles.filterCountText}>
            {todayCount} konten difilter hari ini
          </Text>
        </View>

        {/* Toggle */}
        <TouchableOpacity
          style={[styles.toggleButton, state.serviceEnabled && styles.toggleButtonActive]}
          onPress={toggleService}
        >
          <Text style={styles.toggleText}>
            {state.serviceEnabled ? 'Nonaktifkan Filter' : 'Aktifkan Filter'}
          </Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('KeywordList')}
          >
            <Text style={styles.actionIcon}>🔑</Text>
            <Text style={styles.actionTitle}>Kata Kunci</Text>
            <Text style={styles.actionSub}>Kelola daftar kata kunci terlarang</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Riwayat</Text>
            <Text style={styles.actionSub}>Konten yang telah difilter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionTitle}>Pengaturan</Text>
            <Text style={styles.actionSub}>Konfigurasi filter dan privasi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={checkStatus}>
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionTitle}>Periksa</Text>
            <Text style={styles.actionSub}>Periksa status aksesibilitas</Text>
          </TouchableOpacity>
        </View>

        {/* Monitored Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplikasi yang Dipantau</Text>
          {activeApps.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada aplikasi yang dipantau</Text>
          ) : (
            activeApps.map(app => (
              <View key={app.packageName} style={styles.appRow}>
                <Text style={styles.appName}>{app.displayName}</Text>
                <View style={styles.appStatusBadge}>
                  <Text style={styles.appStatusText}>Aktif</Text>
                </View>
              </View>
            ))
          )}
          {MONITORED_APPS.filter(a => !a.enabled).length > 0 && (
            <Text style={styles.moreApps}>
              +{MONITORED_APPS.filter(a => !a.enabled).length} aplikasi nonaktif
              — Aktifkan di Pengaturan
            </Text>
          )}
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>🔒 Privasi</Text>
          <Text style={styles.privacyText}>
            Semua pemrosesan dilakukan di perangkat. Data layar tidak dikirim ke server
            eksternal. Lihat detail di Pengaturan.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusCardActive: {
    borderColor: '#6366f1',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  dotActive: {
    backgroundColor: '#22c55e',
  },
  dotInactive: {
    backgroundColor: '#64748b',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  filterCountText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  toggleButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleButtonActive: {
    borderColor: '#6366f1',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  actionSub: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  appName: {
    fontSize: 15,
    color: '#f1f5f9',
    fontWeight: '500',
  },
  appStatusBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  appStatusText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  moreApps: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  privacyBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
});