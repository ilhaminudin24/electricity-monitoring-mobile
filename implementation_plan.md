# React Native + Expo Implementation Plan: CatatToken.ID Mobile

## Overview

| Item | Detail |
|------|--------|
| **Framework** | React Native + Expo SDK 52 |
| **Language** | TypeScript |
| **Target** | Android + iOS |
| **Timeline** | 5-6 weeks |
| **Code Reuse** | ~65% dari web app |

---

## Complete Project Structure

```
electricity-monitoring-mobile/
│
├── app/                              # Expo Router (file-based routing)
│   ├── _layout.tsx                   # Root layout + providers
│   ├── index.tsx                     # Landing/splash redirect
│   │
│   ├── (auth)/                       # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx                 # Login screen
│   │   ├── register.tsx              # Register screen
│   │   ├── forgot-password.tsx       # Forgot password
│   │   └── reset-password.tsx        # Reset password
│   │
│   └── (tabs)/                       # Main app (authenticated)
│       ├── _layout.tsx               # Tab navigator
│       ├── index.tsx                 # Dashboard
│       ├── input.tsx                 # Input Form
│       ├── history.tsx               # History
│       └── settings.tsx              # Settings
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── GoogleSignInButton.tsx
│   │   └── PasswordResetForm.tsx
│   │
│   ├── dashboard/
│   │   ├── TotalUsageCard.tsx         # Bar chart + stats
│   │   ├── EstCostCard.tsx            # Budget progress
│   │   ├── TokenPredictionCard.tsx    # Remaining kWh
│   │   ├── ConsumptionChart.tsx       # Area/Line/Bar trends
│   │   ├── TokenBalanceChart.tsx      # Balance history
│   │   ├── MonthlyHistoryChart.tsx    # Monthly bars
│   │   ├── GlobalFilterBar.tsx        # Day/Week/Month toggle
│   │   ├── AlertBox.tsx               # Usage warnings
│   │   └── RecentReadingsList.tsx     # Last 5 readings
│   │
│   ├── input/
│   │   ├── TabSelector.tsx            # Reading/TopUp tabs
│   │   ├── ReadingForm.tsx            # Record reading mode
│   │   ├── TopUpForm.tsx              # Top-up mode
│   │   ├── PhotoCapture.tsx           # Camera/gallery picker
│   │   └── ConsumptionPreview.tsx     # Usage preview
│   │
│   ├── history/
│   │   ├── HistoryList.tsx            # FlatList of readings
│   │   ├── HistoryFilters.tsx         # Search, date, type
│   │   ├── ReadingItem.tsx            # Single row
│   │   └── TypeBadge.tsx              # Reading/TopUp badge
│   │
│   ├── settings/
│   │   ├── ProfileCard.tsx            # Avatar, name, email
│   │   ├── TariffConfig.tsx           # PLN/Custom tabs
│   │   ├── BudgetConfig.tsx           # Monthly budget
│   │   └── LanguageSelector.tsx       # EN/ID toggle
│   │
│   ├── modals/
│   │   ├── EditReadingModal.tsx       # Mode-locked edit
│   │   ├── DeleteConfirmModal.tsx     # Delete confirmation
│   │   ├── DuplicateDateModal.tsx     # Duplicate handling
│   │   ├── ReadingAnomalyModal.tsx    # Validation warning
│   │   └── ImageViewerModal.tsx       # Full-screen image
│   │
│   └── ui/
│       ├── GlassCard.tsx              # Glassmorphism container
│       ├── GradientButton.tsx         # Primary action button
│       ├── Input.tsx                  # Text input
│       ├── BottomSheet.tsx            # Modal sheet
│       ├── LoadingSpinner.tsx         # Loading state
│       └── Toast.tsx                  # Notifications
│
├── shared/                            # 🔄 FROM WEB APP
│   ├── utils/
│   │   ├── analytics.ts               # ✅ computeDailyUsage, etc.
│   │   ├── tariff.ts                  # ✅ estimateKwhFromTokenCost
│   │   ├── settings.ts                # ✅ calculateTokenAmount
│   │   ├── rupiah.ts                  # ✅ formatRupiah
│   │   ├── date.ts                    # ✅ formatDate utilities
│   │   ├── localeFormatter.ts         # ✅ locale formatting
│   │   └── validationService.ts       # ✅ input validation
│   │
│   ├── services/
│   │   └── supabaseService.ts         # ⚠️ Minor mobile adaptations
│   │
│   └── i18n/
│       ├── index.ts                   # i18next config
│       ├── en.json                    # ✅ English translations
│       └── id.json                    # ✅ Indonesian translations
│
├── contexts/
│   ├── AuthContext.tsx                # Auth state management
│   └── SettingsContext.tsx            # App settings
│
├── hooks/
│   ├── useAuth.ts                     # Auth hook
│   ├── useReadings.ts                 # Readings data hook
│   ├── useBudget.ts                   # Budget calculations
│   └── useNotifications.ts            # Push notifications
│
├── lib/
│   ├── supabase.ts                    # Supabase client
│   └── storage.ts                     # AsyncStorage helpers
│
├── constants/
│   ├── colors.ts                      # Color palette
│   ├── tariffs.ts                     # PLN tariff data
│   └── layout.ts                      # Layout constants
│
├── assets/
│   ├── images/
│   │   └── logo.png
│   └── fonts/
│       └── Inter-*.ttf
│
├── app.json                           # Expo configuration
├── eas.json                           # EAS Build config
├── package.json
└── tsconfig.json
```

---

## Core Process 1: Authentication Flow

### Web → Mobile Mapping

| Web Component | Mobile Component | Notes |
|---------------|------------------|-------|
| `Login.jsx` | `app/(auth)/login.tsx` | Native inputs |
| `Register.jsx` | `app/(auth)/register.tsx` | Form validation |
| `AuthCallback.jsx` | Deep link handler | URL scheme |
| `ForgotPassword.jsx` | `app/(auth)/forgot-password.tsx` | Same flow |
| `AuthContext.js` | `contexts/AuthContext.tsx` | AsyncStorage |

### Supabase Mobile Auth Setup

```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Google OAuth Deep Linking

```json
// app.json
{
  "expo": {
    "scheme": "catattoken",
    "ios": {
      "bundleIdentifier": "com.catattoken.app",
      "associatedDomains": ["applinks:catattoken.id"]
    },
    "android": {
      "package": "com.catattoken.app",
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          { "scheme": "catattoken" },
          { "scheme": "https", "host": "catattoken.id", "pathPrefix": "/auth" }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
```

### Auth Features to Implement

- [x] Email/Password Login
- [x] Email/Password Registration
- [x] Google OAuth dengan deep linking
- [x] Password Reset via Email
- [x] Session persistence (AsyncStorage)
- [x] Auto refresh token
- [ ] **NEW**: Biometric login (FaceID/TouchID)

---

## Core Process 2: Meter Reading Input

### Web → Mobile Mapping

| Web Component | Mobile Component | Notes |
|---------------|------------------|-------|
| `InputForm.jsx` | `app/(tabs)/input.tsx` | Tabbed interface |
| Tab: Record Reading | `components/input/ReadingForm.tsx` | Blue theme |
| Tab: Top Up | `components/input/TopUpForm.tsx` | Yellow theme |
| Photo upload | `components/input/PhotoCapture.tsx` | Camera native |
| `DuplicateDateModal.jsx` | `components/modals/DuplicateDateModal.tsx` | Bottom sheet |
| `ReadingAnomalyModal.jsx` | `components/modals/ReadingAnomalyModal.tsx` | Bottom sheet |

### Input Form Implementation

```typescript
// app/(tabs)/input.tsx
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { TabSelector } from '@/components/input/TabSelector';
import { ReadingForm } from '@/components/input/ReadingForm';
import { TopUpForm } from '@/components/input/TopUpForm';

type InputMode = 'reading' | 'topup';

export default function InputScreen() {
  const [mode, setMode] = useState<InputMode>('reading');
  
  return (
    <ScrollView>
      <TabSelector mode={mode} onModeChange={setMode} />
      {mode === 'reading' ? <ReadingForm /> : <TopUpForm />}
    </ScrollView>
  );
}
```

### Camera Integration

```typescript
// components/input/PhotoCapture.tsx
import * as ImagePicker from 'expo-image-picker';

export function PhotoCapture({ onPhotoSelected }) {
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    
    if (!result.canceled) {
      onPhotoSelected(result.assets[0].uri);
    }
  };
  
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    
    if (!result.canceled) {
      onPhotoSelected(result.assets[0].uri);
    }
  };
  
  return (/* Camera/Gallery buttons */);
}
```

### Input Features to Implement

- [x] Tabbed interface (Reading/TopUp)
- [x] Date/Time picker (native)
- [x] kWh input dengan validation
- [x] Smart Pre-fill untuk Top-Up
- [x] Camera capture untuk foto meter
- [x] Gallery picker
- [x] Consumption preview
- [x] Duplicate date detection
- [x] Reading anomaly detection
- [x] Notes input
- [x] Submit dengan loading state

---

## Core Process 3: Dashboard Analytics

### Web → Mobile Mapping

| Web Component | Mobile Component | Chart Library |
|---------------|------------------|---------------|
| `TotalUsageCard.jsx` | `dashboard/TotalUsageCard.tsx` | Victory Native |
| `EstCostCard.jsx` | `dashboard/EstCostCard.tsx` | Progress bar |
| `TokenPredictionCard.jsx` | `dashboard/TokenPredictionCard.tsx` | Native UI |
| `MainUsageChart.jsx` | Split into 3 components | Victory Native |
| `GlobalFilterBar.jsx` | `dashboard/GlobalFilterBar.tsx` | SegmentedControl |
| `AlertBox.jsx` | `dashboard/AlertBox.tsx` | Native alert card |
| `RecentReadingsList.jsx` | `dashboard/RecentReadingsList.tsx` | FlatList |

### Dashboard Layout (Mobile)

```
┌─────────────────────────────────┐
│   Welcome, [User Name]!         │
│   Day • Week • Month            │  ← GlobalFilterBar
├─────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐        │
│  │ Usage   │ │ Est.    │        │  ← TotalUsageCard, EstCostCard
│  │ Chart   │ │ Cost    │        │
│  └─────────┘ └─────────┘        │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │   Token Prediction      │    │  ← TokenPredictionCard
│  │   XX kWh remaining      │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │  Consumption Trends     │    │  ← ConsumptionChart
│  │  [Area/Line Chart]      │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │  Token Balance History  │    │  ← TokenBalanceChart
│  │  [Line Chart]           │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  ⚠️ Alert: High usage today     │  ← AlertBox
├─────────────────────────────────┤
│  Recent Readings                │  ← RecentReadingsList
│  • Dec 21 - 145.5 kWh          │
│  • Dec 20 - 148.2 kWh          │
└─────────────────────────────────┘
```

### Victory Native Chart Example

```typescript
// components/dashboard/ConsumptionChart.tsx
import { VictoryChart, VictoryArea, VictoryAxis, VictoryTheme } from 'victory-native';

export function ConsumptionChart({ data, filter }) {
  return (
    <VictoryChart theme={VictoryTheme.material} height={220}>
      <VictoryAxis
        tickFormat={(t) => formatDateLabel(t, filter)}
        style={{ tickLabels: { fontSize: 10 } }}
      />
      <VictoryAxis dependentAxis tickFormat={(t) => `${t} kWh`} />
      <VictoryArea
        data={data}
        x="date"
        y="usage"
        style={{
          data: { fill: '#3B82F6', fillOpacity: 0.3, stroke: '#3B82F6' }
        }}
      />
    </VictoryChart>
  );
}
```

### Dashboard Features to Implement

- [x] Global filter bar (Day/Week/Month)
- [x] Total usage card dengan bar chart
- [x] Top-up event markers (yellow)
- [x] Estimated cost dengan budget progress
- [x] Token prediction (remaining kWh + days)
- [x] Consumption trends chart
  - Day: Today vs Yesterday
  - Week: Weekly bars dengan date ranges
  - Month: Monthly line chart
- [x] Token balance history chart
- [x] Monthly history bar chart
- [x] Usage alerts
- [x] Recent readings list
- [ ] **NEW**: Pull-to-refresh

---

## Core Process 4: History Management

### Web → Mobile Mapping

| Web Component | Mobile Component | Notes |
|---------------|------------------|-------|
| `History.jsx` | `app/(tabs)/history.tsx` | FlatList |
| Table | `components/history/HistoryList.tsx` | Cards instead |
| Filters | `components/history/HistoryFilters.tsx` | Bottom sheet |
| Edit modal | `components/modals/EditReadingModal.tsx` | Full screen |
| Delete modal | `components/modals/DeleteConfirmModal.tsx` | Alert |

### History List Implementation

```typescript
// components/history/HistoryList.tsx
import { FlatList, RefreshControl } from 'react-native';
import { ReadingItem } from './ReadingItem';

export function HistoryList({ readings, onEdit, onDelete, onRefresh }) {
  return (
    <FlatList
      data={readings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ReadingItem
          reading={item}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
      ListEmptyComponent={<EmptyState />}
    />
  );
}
```

### History Features to Implement

- [x] Virtualized list (FlatList)
- [x] Pull-to-refresh
- [x] Search filter
- [x] Date range filter (30 days/12 months/All)
- [x] Type filter (All/Reading/TopUp)
- [x] Type badges (color-coded)
- [x] Edit action (mode-locked)
- [x] Delete action dengan confirmation
- [x] View proof image (full screen)
- [x] Infinite scroll / pagination
- [ ] **NEW**: Swipe actions (edit/delete)

---

## Core Process 5: Settings Management

### Web → Mobile Mapping

| Web Component | Mobile Component | Notes |
|---------------|------------------|-------|
| `Settings.jsx` | `app/(tabs)/settings.tsx` | ScrollView |
| Profile section | `components/settings/ProfileCard.tsx` | Avatar |
| Tariff config | `components/settings/TariffConfig.tsx` | Picker |
| Budget config | `components/settings/BudgetConfig.tsx` | Slider |

### Settings Features to Implement

- [x] Profile display (avatar, name, email)
- [x] Edit display name
- [x] Tariff mode toggle (PLN/Custom)
- [x] PLN tariff group selector
- [x] Power capacity selector
- [x] Custom tariff inputs
- [x] Admin fee input
- [x] Tax percentage input
- [x] Monthly budget input
- [x] Alert threshold slider
- [x] Budget preview cards
- [x] Save configuration
- [x] Language switcher (EN/ID)
- [ ] **NEW**: Logout button
- [ ] **NEW**: App version info
- [ ] **NEW**: Notification preferences
- [ ] **NEW**: Dark/Light theme toggle

---

## Core Process 6: Token/Tariff Calculation

### Web → Mobile (100% Reusable)

```typescript
// shared/utils/tariff.ts - COPY LANGSUNG
export function estimateKwhFromTokenCost(
  tokenCost: number,
  adminFee: number,
  taxPercent: number,
  tiers: TariffTier[]
): number {
  // Logic sama persis dengan web
}

// shared/utils/settings.ts - COPY LANGSUNG
export function calculateTokenAmount(
  tokenCost: number,
  settings: Settings
): number | null {
  // Logic sama persis dengan web
}
```

### Tariff Features (Already Implemented in Utils)

- [x] Tiered tariff calculation
- [x] PLN official rates
- [x] Custom tariff support
- [x] Admin fee deduction
- [x] Tax calculation
- [x] Fallback rate

---

## Core Process 7: Internationalization (i18n)

### Web → Mobile Setup

```typescript
// shared/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import id from './id.json';

const LANGUAGE_KEY = 'app_language';

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, id: { translation: id } },
    lng: 'id', // Default Indonesian
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// Load saved language
AsyncStorage.getItem(LANGUAGE_KEY).then((lang) => {
  if (lang) i18n.changeLanguage(lang);
});

export const changeLanguage = async (lang: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};

export default i18n;
```

### i18n Features

- [x] English translations (en.json) - COPY
- [x] Indonesian translations (id.json) - COPY
- [x] Language detector
- [x] Language persistence
- [x] Language switcher component
- [x] Locale-aware formatting

---

## Core Process 8: Premium UI Design System

### Web → Mobile Mapping

| Web (TailwindCSS) | Mobile Alternative |
|-------------------|-------------------|
| `tailwindcss` | `nativewind` |
| `framer-motion` | `react-native-reanimated` |
| `lucide-react` | `lucide-react-native` |
| Glassmorphism CSS | `expo-blur` + StyleSheet |
| Google Fonts | `expo-font` |

### Color Palette (constants/colors.ts)

```typescript
export const colors = {
  primary: {
    50: '#EEF2FF',
    500: '#4F46E5',
    600: '#4338CA',
  },
  secondary: {
    50: '#ECFDF5',
    500: '#10B981',
    600: '#059669',
  },
  accent: {
    50: '#FFFBEB',
    500: '#F59E0B',
    600: '#D97706',
  },
  slate: {
    50: '#F8FAFC',
    800: '#1E293B',
    900: '#0F172A',
  },
  // Theme colors
  reading: '#3B82F6',   // Blue for reading mode
  topup: '#F59E0B',     // Yellow for top-up mode
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};
```

### Glass Card Component

```typescript
// components/ui/GlassCard.tsx
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassCard({ children, intensity = 20 }) {
  return (
    <BlurView intensity={intensity} style={styles.card}>
      <View style={styles.content}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
```

---

## Mobile-Specific Enhancements

### 1. Push Notifications

```typescript
// hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';

export function useNotifications() {
  const scheduleTokenAlert = async (daysRemaining: number) => {
    if (daysRemaining <= 3) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Token Hampir Habis! ⚡',
          body: `Sisa token Anda akan habis dalam ${daysRemaining} hari`,
        },
        trigger: { seconds: 1 },
      });
    }
  };
  
  return { scheduleTokenAlert };
}
```

### 2. Biometric Authentication

```typescript
// lib/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticateWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login dengan Fingerprint/Face ID',
      fallbackLabel: 'Gunakan Password',
    });
    return result.success;
  }
  return false;
}
```

### 3. Offline Support

```typescript
// lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function cacheReadings(readings: Reading[]) {
  await AsyncStorage.setItem('cached_readings', JSON.stringify(readings));
}

export async function getCachedReadings(): Promise<Reading[]> {
  const data = await AsyncStorage.getItem('cached_readings');
  return data ? JSON.parse(data) : [];
}

export async function queueOfflineReading(reading: Reading) {
  const queue = await getOfflineQueue();
  queue.push(reading);
  await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
}

export async function syncOfflineQueue() {
  const queue = await getOfflineQueue();
  for (const reading of queue) {
    await supabaseService.addReading(reading);
  }
  await AsyncStorage.removeItem('offline_queue');
}
```

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react-native": "0.76.x",
    
    "@supabase/supabase-js": "^2.45.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "react-native-url-polyfill": "^2.0.0",
    
    "victory-native": "^41.0.0",
    "react-native-svg": "^15.8.0",
    
    "i18next": "^23.7.6",
    "react-i18next": "^13.5.0",
    
    "expo-image-picker": "~16.0.0",
    "expo-camera": "~16.0.0",
    "expo-blur": "~14.0.0",
    "expo-font": "~13.0.0",
    "expo-notifications": "~0.29.0",
    "expo-local-authentication": "~15.0.0",
    "expo-secure-store": "~14.0.0",
    
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "lucide-react-native": "^0.460.0",
    "date-fns": "^2.30.0",
    
    "nativewind": "^4.0.0"
  }
}
```

---

## Development Timeline

### Week 1: Foundation
| Day | Tasks |
|-----|-------|
| 1 | Project setup, Expo init, folder structure |
| 2 | Supabase client, AsyncStorage setup |
| 3 | Auth context, Login screen |
| 4 | Register screen, Password reset |
| 5 | Google OAuth dengan deep linking |

### Week 2: Input & Core
| Day | Tasks |
|-----|-------|
| 1 | Input screen layout, TabSelector |
| 2 | ReadingForm dengan validation |
| 3 | TopUpForm dengan smart pre-fill |
| 4 | PhotoCapture (camera/gallery) |
| 5 | DuplicateDateModal, AnomalyModal |

### Week 3: Dashboard
| Day | Tasks |
|-----|-------|
| 1 | Dashboard layout, GlobalFilterBar |
| 2 | TotalUsageCard dengan Victory chart |
| 3 | EstCostCard, TokenPredictionCard |
| 4 | ConsumptionChart (all filter modes) |
| 5 | TokenBalanceChart, MonthlyHistoryChart |

### Week 4: History & Settings
| Day | Tasks |
|-----|-------|
| 1 | History screen, HistoryList |
| 2 | Filters, search, pagination |
| 3 | EditReadingModal (mode-locked) |
| 4 | Settings screen layout |
| 5 | TariffConfig, BudgetConfig |

### Week 5: Polish & Features
| Day | Tasks |
|-----|-------|
| 1 | Push notifications setup |
| 2 | Biometric authentication |
| 3 | Offline support |
| 4 | i18n integration, testing |
| 5 | UI polish, animations |

### Week 6: Testing & Release
| Day | Tasks |
|-----|-------|
| 1-2 | Bug fixes, edge cases |
| 3 | EAS Build configuration |
| 4 | Android build & testing |
| 5 | iOS build & TestFlight |

---

## Build & Deployment

### EAS Build Setup

```json
// eas.json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "autoIncrement": true }
    }
  },
  "submit": {
    "production": {
      "android": { "track": "internal" },
      "ios": { "ascAppId": "YOUR_APP_ID" }
    }
  }
}
```

### Build Commands

```bash
# Development build
eas build --profile development --platform all

# Preview (APK untuk testing)
eas build --profile preview --platform android

# Production (untuk store)
eas build --profile production --platform all

# Submit ke stores
eas submit --platform android
eas submit --platform ios
```

---

## Verification Plan

### Automated Tests
- Unit tests untuk shared utilities (Jest)
- Component tests (React Native Testing Library)

### Manual Testing Checklist
- [ ] Auth: Login/Register/Logout flows
- [ ] Auth: Google OAuth deep linking
- [ ] Input: Both modes, validation, photo
- [ ] Dashboard: All charts render correctly
- [ ] Dashboard: Filters work as expected
- [ ] History: Scroll, filter, edit, delete
- [ ] Settings: Save and persist
- [ ] i18n: Language switching
- [ ] Offline: Cached data displays
- [ ] Notifications: Token alerts

### Device Testing
- [ ] Android Emulator (API 30+)
- [ ] Android Physical Device
- [ ] iOS Simulator (iPhone 14+)
- [ ] iOS Physical Device (TestFlight)
