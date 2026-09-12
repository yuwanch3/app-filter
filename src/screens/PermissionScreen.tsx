import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../context/AppContext';
import { useAccessibilityService, useFilterStats } from '../hooks';

export default function PermissionScreen({ navigation }: any) {
  const { state, dispatch } = useAppState();
  const { isEnabled, isChecking, openSettings } = useAccessibilityService();
  const [step, setStep] = useState<'accessibility' | 'notification' | 'done'>('accessibility');
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if (isEnabled && notifGranted) {
      setStep('done');
      dispatch({ type: 'SET_PERMISSIONS', payload: true });
      setTimeout(() => navigation.replace('Dashboard'), 1500);
    } else if (isEnabled) {
      setStep('notification');
    }
  }, [isEnabled, notifGranted]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>AppFilter</Text>
        <Text style={styles.subtitle}>Filter Konten Media Sosial</Text>

        <View style={styles.card}>
          {isChecking ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : step === 'accessibility' ? (
            <>
              <Text style={styles.cardTitle}>1. Aktifkan Aksesibilitas</Text>
              <Text style={styles.cardText}>
                AppFilter membutuhkan aksesibilitas untuk membaca konten layar dari YouTube,
                Instagram, TikTok, dan X guna mendeteksi dan menyembunyikan konten sensitif.
              </Text>
              <Text style={styles.privacyText}>
                Data yang dibaca hanya diproses di device. Tidak ada data yang dikirim ke server
                eksternal tanpa izin Anda.
              </Text>
              <TouchableOpacity style={styles.button} onPress={openSettings}>
                <Text style={styles.buttonText}>Buka Pengaturan Aksesibilitas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => setStep('notification')}
              >
                <Text style={styles.skipButtonText}>Sudah Aktif? Lanjutkan</Text>
              </TouchableOpacity>
            </>
          ) : step === 'notification' ? (
            <>
              <Text style={styles.cardTitle}>
                2. Izinkan Notifikasi
              </Text>
              <Text style={styles.cardText}>
                Notifikasi diperlukan untuk menampilkan status filter dan ringkasan konten
                yang difilter (tanpa detail sensitif).
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setNotifGranted(true);
                }}
              >
                <Text style={styles.buttonText}>Izinkan Notifikasi</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>✓ Siap Digunakan</Text>
              <Text style={styles.cardText}>
                Semua izin telah diberikan. AppFilter akan mulai memfilter konten sensitif
                secara otomatis.
              </Text>
            </>
          )}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 40,
  },
  card: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 12,
    color: '#6366f1',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#6366f1',
    fontSize: 14,
  },
});