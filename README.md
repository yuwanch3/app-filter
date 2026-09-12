# AppFilter - Social Media Content Filter

Aplikasi Android untuk memfilter konten sensitif dari media sosial (YouTube, Instagram, TikTok, X) menggunakan AccessibilityService.

## Arsitektur

```
appfilter/
├── App.tsx                    # Entry point React Navigation
├── index.ts                   # Expo entry
├── src/
│   ├── context/AppContext.tsx  # State management (useReducer)
│   ├── hooks/index.ts         # Custom hooks
│   ├── native/NativeBridge.ts # Bridge ke native Android module
│   ├── screens/
│   │   ├── PermissionScreen   # Izin aksesibilitas & notifikasi
│   │   ├── DashboardScreen    # Halaman utama & kontrol
│   │   ├── KeywordListScreen  # Kelola kata kunci filter
│   │   ├── SettingsScreen     # Konfigurasi & privasi
│   │   └── HistoryScreen      # Riwayat konten difilter
│   ├── services/
│   │   ├── DatabaseService    # SQLite (expo-sqlite)
│   │   ├── FilterEngineService# Orchestrator filter
│   │   ├── KeywordFilterEngine# Keyword matching lokal
│   │   └── ModerationService  # API moderasi (local/cloud)
│   └── types/
│       ├── index.ts           # Type definitions
│       └── navigation.ts      # Navigation types
├── android/
│   └── app/src/main/java/com/appfilter/
│       ├── accessibility/
│       │   ├── AppFilterAccessibilityService.kt  # Service utama
│       │   ├── AppFilterModule.kt                # RN Bridge
│       │   ├── AppFilterPackage.kt               # ReactPackage
│       │   └── OverlayActivity.kt                # Overlay blur
│       ├── filter/KeywordFilter.kt               # Filter native
│       ├── models/UICapture.kt                   # Data model
│       ├── service/FilterForegroundService.kt     # Foreground service
│       └── app/
│           ├── MainActivity.kt
│           └── MainApplication.kt
├── proxy-server/
│   ├── server.js              # Backend proxy (opsional)
│   └── package.json
└── config files (app.json, eas.json, ...)
```

## Setup

```bash
# Install dependencies
npm install

# Build development client (Android)
npx expo run:android

# Run proxy server (opsional, untuk cloud moderation)
cd proxy-server && node server.js
```

## Fitur

- **Filter Kata Kunci:** Blokir konten berdasarkan daftar kata kunci (dikelola user)
- **Deteksi Feed:** Baca konten dari AccessibilityService dan blur jika sensitif
- **Multi-platform:** Dukung YouTube, Instagram, TikTok, X
- **Foreground Service:** Tetap aktif meski aplikasi ditutup
- **Privasi:** Semua pemrosesan on-device (opsional cloud API)
- **Riwayat:** Catat konten yang difilter

## Catatan Penting

- Aplikasi untuk **sideload pribadi**, tidak dipublikasikan ke Play Store
- AccessibilityService hanya membaca konten dari aplikasi yang dipilih
- Aksi report/block membutuhkan konfirmasi user (bukan otomatis)
- Struktur UI platform target berubah tiap update — mapping AccessibilityNodeInfo butuh maintenance berkala