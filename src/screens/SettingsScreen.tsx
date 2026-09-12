import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../context/AppContext';
import { filterEngine } from '../services/FilterEngineService';
import { moderationService } from '../services/ModerationService';
import { MONITORED_APPS } from '../types';

export default function SettingsScreen() {
  const { state, dispatch } = useAppState();
  const config = state.config;

  const toggleConfig = useCallback((key: keyof typeof config, value: boolean) => {
    dispatch({ type: 'SET_CONFIG', payload: { [key]: value } });
    if (key === 'enableKeywordFilter') {
      filterEngine.setEnabled(value);
    }
  }, [dispatch, config]);

  const setModerationApi = useCallback((api: 'local' | 'cloud') => {
    Alert.alert(
      'Ganti API Moderasi',
      api === 'cloud'
        ? 'Mode cloud akan mengirim data ke server eksternal. Pastikan Anda memahami implikasi privasi.'
        : 'Mode lokal memproses semuanya di device tanpa koneksi internet.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ganti',
          onPress: () => {
            dispatch({ type: 'SET_CONFIG', payload: { moderationApi: api } });
            moderationService.configure({ type: api });
          },
        },
      ],
    );
  }, [dispatch]);

  const toggleMonitoredApp = useCallback((packageName: string) => {
    const updated = config.monitoredApps.includes(packageName)
      ? config.monitoredApps.filter(a => a !== packageName)
      : [...config.monitoredApps, packageName];

    dispatch({ type: 'SET_CONFIG', payload: { monitoredApps: updated } });
  }, [config.monitoredApps, dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Filter Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan Filter</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Filter Kata Kunci</Text>
              <Text style={styles.settingDesc}>Cocokkan teks layar dengan daftar kata kunci</Text>
            </View>
            <Switch
              value={config.enableKeywordFilter}
              onValueChange={v => toggleConfig('enableKeywordFilter', v)}
              trackColor={{ false: '#334155', true: '#6366f1' }}
              thumbColor={config.enableKeywordFilter ? '#818cf8' : '#64748b'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Blur Otomatis</Text>
              <Text style={styles.settingDesc}>Sembunyikan konten sensitif dengan overlay</Text>
            </View>
            <Switch
              value={config.autoBlur}
              onValueChange={v => toggleConfig('autoBlur', v)}
              trackColor={{ false: '#334155', true: '#6366f1' }}
              thumbColor={config.autoBlur ? '#818cf8' : '#64748b'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifikasi Aktif</Text>
              <Text style={styles.settingDesc}>
                Tampilkan notifikasi status filter (tanpa detail sensitif)
              </Text>
            </View>
            <Switch
              value={config.enableNotification}
              onValueChange={v => toggleConfig('enableNotification', v)}
              trackColor={{ false: '#334155', true: '#6366f1' }}
              thumbColor={config.enableNotification ? '#818cf8' : '#64748b'}
            />
          </View>
        </View>

        {/* Moderation API */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Moderasi</Text>
          <Text style={styles.sectionDesc}>
            Pilih metode klasifikasi konten. Lokal lebih privat tapi akurasinya lebih rendah.
          </Text>

          <TouchableOpacity
            style={[styles.apiOption, config.moderationApi === 'local' && styles.apiOptionActive]}
            onPress={() => setModerationApi('local')}
          >
            <Text style={styles.apiOptionTitle}>Lokal (On-Device)</Text>
            <Text style={styles.apiOptionDesc}>
              Menggunakan deteksi kata kunci lokal. Tidak ada data yang dikirim ke server.
              Cocok untuk penggunaan pribadi.
            </Text>
            {config.moderationApi === 'local' && (
              <Text style={styles.apiBadge}>Aktif</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.apiOption, config.moderationApi === 'cloud' && styles.apiOptionActive]}
            onPress={() => setModerationApi('cloud')}
          >
            <Text style={styles.apiOptionTitle}>Cloud API</Text>
            <Text style={styles.apiOptionDesc}>
              Gunakan API moderasi eksternal (OpenAI/AWS). Lebih akurat tapi mengirim data
              ke server pihak ketiga. Diperlukan koneksi internet.
            </Text>
            {config.moderationApi === 'cloud' && (
              <Text style={styles.apiBadge}>Aktif</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Monitored Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplikasi yang Dipantau</Text>
          <Text style={styles.sectionDesc}>
            Pilih aplikasi media sosial yang akan difilter kontennya.
          </Text>
          {MONITORED_APPS.map(app => (
            <View key={app.packageName} style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{app.displayName}</Text>
                <Text style={styles.settingDesc}>{app.packageName}</Text>
              </View>
              <Switch
                value={config.monitoredApps.includes(app.packageName)}
                onValueChange={() => toggleMonitoredApp(app.packageName)}
                trackColor={{ false: '#334155', true: '#6366f1' }}
                thumbColor={config.monitoredApps.includes(app.packageName) ? '#818cf8' : '#64748b'}
              />
            </View>
          ))}
        </View>

        {/* Privacy */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔒 Kebijakan Privasi</Text>
          <Text style={styles.privacyText}>
            AppFilter membaca konten layar Anda dari aplikasi media sosial melalui
            AccessibilityService. Data yang dibaca:{'\n\n'}
            • Teks judul, deskripsi, dan caption konten{'\n'}
            • Metadata UI (posisi elemen, ID view){'\n'}
            • Query pencarian yang diketik{'\n\n'}
            Data ini diproses di perangkat Anda. Jika Anda mengaktifkan Cloud API,
            teks akan dikirim ke server moderasi eksternal untuk klasifikasi.
            Tidak ada data pribadi yang disimpan di server.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AppFilter v1.0.0</Text>
          <Text style={styles.footerText}>Untuk penggunaan pribadi</Text>
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f1f5f9',
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  apiOption: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  apiOptionActive: {
    borderColor: '#6366f1',
  },
  apiOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  apiOptionDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  apiBadge: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  privacyCard: {
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
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
  },
});