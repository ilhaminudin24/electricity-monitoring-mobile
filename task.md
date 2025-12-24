# CatatToken.ID Mobile - Development Tasks

> 📱 React Native + Expo Implementation Tracker
> Timeline: 5-6 minggu | Target: Android + iOS

---

## 📌 Phase 1: Foundation (Week 1)

### 1.1 Project Setup
- [ ] Initialize Expo project dengan TypeScript
- [ ] Setup folder structure sesuai plan
- [ ] Install core dependencies
- [ ] Configure `app.json` (scheme, bundleIdentifier, package)
- [ ] Setup `.env` untuk Supabase credentials
- [ ] Configure `tsconfig.json`

### 1.2 Supabase & Storage
- [ ] Install `@supabase/supabase-js`
- [ ] Install `@react-native-async-storage/async-storage`
- [ ] Install `react-native-url-polyfill`
- [ ] Create `lib/supabase.ts` dengan AsyncStorage adapter
- [ ] Create `lib/storage.ts` helpers

### 1.3 Auth - Login
- [ ] Create `contexts/AuthContext.tsx`
- [ ] Create `app/_layout.tsx` dengan providers
- [ ] Create `app/(auth)/_layout.tsx`
- [ ] Create `app/(auth)/login.tsx`
- [ ] Create `components/auth/LoginForm.tsx`
- [ ] Implement email/password login

### 1.4 Auth - Register & Password Reset
- [ ] Create `app/(auth)/register.tsx`
- [ ] Create `components/auth/RegisterForm.tsx`
- [ ] Create `app/(auth)/forgot-password.tsx`
- [ ] Create `components/auth/PasswordResetForm.tsx`
- [ ] Test registration flow
- [ ] Test password reset email

### 1.5 Auth - Google OAuth
- [ ] Configure deep linking di `app.json`
- [ ] Create `components/auth/GoogleSignInButton.tsx`
- [ ] Setup URL scheme handler
- [ ] Test Google OAuth redirect
- [ ] Handle auth callback

---

## 📌 Phase 2: Input Form (Week 2)

### 2.1 Input Screen Layout
- [ ] Create `app/(tabs)/_layout.tsx` (Tab Navigator)
- [ ] Create `app/(tabs)/input.tsx`
- [ ] Create `components/input/TabSelector.tsx`
- [ ] Style mode toggle (Reading: Blue, TopUp: Yellow)

### 2.2 Reading Form
- [ ] Create `components/input/ReadingForm.tsx`
- [ ] Implement date/time picker (native)
- [ ] Implement kWh input dengan validation
- [ ] Create `components/input/ConsumptionPreview.tsx`
- [ ] Implement notes input
- [ ] Add submit dengan loading state

### 2.3 TopUp Form
- [ ] Create `components/input/TopUpForm.tsx`
- [ ] Implement token cost input (Rupiah)
- [ ] Implement smart pre-fill calculation
- [ ] Copy `shared/utils/tariff.ts` dari web
- [ ] Copy `shared/utils/settings.ts` dari web
- [ ] Test pre-fill accuracy

### 2.4 Photo Capture
- [ ] Install `expo-image-picker`
- [ ] Install `expo-camera`
- [ ] Create `components/input/PhotoCapture.tsx`
- [ ] Implement camera capture
- [ ] Implement gallery picker
- [ ] Handle image compression (quality: 0.7)

### 2.5 Input Modals
- [ ] Create `components/modals/DuplicateDateModal.tsx`
- [ ] Create `components/modals/ReadingAnomalyModal.tsx`
- [ ] Implement duplicate date detection
- [ ] Implement anomaly detection (sudden drops/spikes)
- [ ] Test modal interactions

---

## 📌 Phase 3: Dashboard (Week 3)

### 3.1 Dashboard Layout
- [ ] Create `app/(tabs)/index.tsx` (Dashboard)
- [ ] Create `components/dashboard/GlobalFilterBar.tsx`
- [ ] Implement Day/Week/Month toggle
- [ ] Setup ScrollView layout

### 3.2 Summary Cards
- [ ] Install `victory-native` dan `react-native-svg`
- [ ] Create `components/dashboard/TotalUsageCard.tsx`
- [ ] Implement bar chart dengan Victory
- [ ] Create `components/dashboard/EstCostCard.tsx`
- [ ] Implement budget progress bar
- [ ] Create `components/dashboard/TokenPredictionCard.tsx`
- [ ] Display remaining kWh dan days

### 3.3 Consumption Chart
- [ ] Create `components/dashboard/ConsumptionChart.tsx`
- [ ] Implement Area chart for Day filter (Today vs Yesterday)
- [ ] Implement Bar chart for Week filter
- [ ] Implement Line chart for Month filter
- [ ] Add top-up event markers (yellow)
- [ ] Copy `shared/utils/analytics.ts` dari web

### 3.4 Balance & History Charts
- [ ] Create `components/dashboard/TokenBalanceChart.tsx`
- [ ] Create `components/dashboard/MonthlyHistoryChart.tsx`
- [ ] Style charts sesuai filter
- [ ] Test chart responsiveness

### 3.5 Alerts & Recent Readings
- [ ] Create `components/dashboard/AlertBox.tsx`
- [ ] Implement high usage warnings
- [ ] Create `components/dashboard/RecentReadingsList.tsx`
- [ ] Display last 5 readings
- [ ] Implement pull-to-refresh

---

## 📌 Phase 4: History & Settings (Week 4)

### 4.1 History Screen
- [ ] Create `app/(tabs)/history.tsx`
- [ ] Create `components/history/HistoryList.tsx` (FlatList)
- [ ] Create `components/history/ReadingItem.tsx`
- [ ] Create `components/history/TypeBadge.tsx`
- [ ] Implement virtualized list

### 4.2 History Filters
- [ ] Create `components/history/HistoryFilters.tsx`
- [ ] Implement search filter
- [ ] Implement date range filter (30d/12m/All)
- [ ] Implement type filter (All/Reading/TopUp)
- [ ] Implement pagination / infinite scroll

### 4.3 History Modals
- [ ] Create `components/modals/EditReadingModal.tsx`
- [ ] Implement mode-locked editing
- [ ] Create `components/modals/DeleteConfirmModal.tsx`
- [ ] Create `components/modals/ImageViewerModal.tsx`
- [ ] Test edit/delete flows

### 4.4 Settings Screen
- [ ] Create `app/(tabs)/settings.tsx`
- [ ] Create `components/settings/ProfileCard.tsx`
- [ ] Display avatar, name, email
- [ ] Implement edit display name

### 4.5 Settings - Tariff & Budget
- [ ] Create `components/settings/TariffConfig.tsx`
- [ ] Implement PLN/Custom toggle
- [ ] Implement tariff group selector
- [ ] Implement power capacity selector
- [ ] Create `components/settings/BudgetConfig.tsx`
- [ ] Implement monthly budget input
- [ ] Implement alert threshold slider
- [ ] Save configuration to Supabase

---

## 📌 Phase 5: Polish & Features (Week 5)

### 5.1 Push Notifications
- [ ] Install `expo-notifications`
- [ ] Create `hooks/useNotifications.ts`
- [ ] Implement token alert notifications
- [ ] Request notification permissions
- [ ] Test notification delivery

### 5.2 Biometric Authentication
- [ ] Install `expo-local-authentication`
- [ ] Create `lib/biometrics.ts`
- [ ] Add biometric login option
- [ ] Handle fallback to password
- [ ] Test on devices dengan Face ID/Fingerprint

### 5.3 Offline Support
- [ ] Implement reading caching (`lib/storage.ts`)
- [ ] Create offline queue untuk pending entries
- [ ] Implement sync on reconnect
- [ ] Show offline indicator

### 5.4 Internationalization (i18n)
- [ ] Install `i18next` dan `react-i18next`
- [ ] Copy `shared/i18n/en.json` dari web
- [ ] Copy `shared/i18n/id.json` dari web
- [ ] Create `shared/i18n/index.ts`
- [ ] Create `components/settings/LanguageSelector.tsx`
- [ ] Test language switching
- [ ] Copy `shared/utils/localeFormatter.ts` dari web

### 5.5 UI Polish
- [ ] Install `expo-blur` dan `expo-font`
- [ ] Install `react-native-reanimated` dan `react-native-gesture-handler`
- [ ] Install `lucide-react-native`
- [ ] Create `components/ui/GlassCard.tsx`
- [ ] Create `components/ui/GradientButton.tsx`
- [ ] Create `components/ui/Input.tsx`
- [ ] Create `components/ui/LoadingSpinner.tsx`
- [ ] Create `components/ui/Toast.tsx`
- [ ] Add entry/exit animations
- [ ] Polish all screens

---

## 📌 Phase 6: Testing & Release (Week 6)

### 6.1 Bug Fixes
- [ ] Test all auth flows
- [ ] Test all input scenarios
- [ ] Test chart rendering di berbagai screen sizes
- [ ] Test history pagination
- [ ] Test settings persistence
- [ ] Fix edge cases

### 6.2 EAS Build Configuration
- [ ] Create `eas.json`
- [ ] Configure development profile
- [ ] Configure preview profile (APK)
- [ ] Configure production profile
- [ ] Setup environment variables di EAS

### 6.3 Android Build
- [ ] Run `eas build --profile preview --platform android`
- [ ] Test APK di emulator
- [ ] Test APK di physical device
- [ ] Fix Android-specific issues

### 6.4 iOS Build
- [ ] Setup Apple Developer account
- [ ] Run `eas build --profile preview --platform ios`
- [ ] Test di iOS Simulator
- [ ] Upload ke TestFlight
- [ ] Test di physical device

### 6.5 Store Submission (Optional)
- [ ] Prepare store assets (screenshots, descriptions)
- [ ] Submit ke Google Play (internal track)
- [ ] Submit ke App Store (TestFlight/review)

---

## 📊 Progress Summary

| Phase | Status | Tasks |
|-------|--------|-------|
| Phase 1: Foundation | ⬜ Not Started | 0/28 |
| Phase 2: Input Form | ⬜ Not Started | 0/25 |
| Phase 3: Dashboard | ⬜ Not Started | 0/22 |
| Phase 4: History & Settings | ⬜ Not Started | 0/24 |
| Phase 5: Polish & Features | ⬜ Not Started | 0/25 |
| Phase 6: Testing & Release | ⬜ Not Started | 0/15 |
| **Total** | ⬜ | **0/139** |

---

## 🔄 Shared Code dari Web (Copy Langsung)

Berikut file-file yang bisa di-copy 100% dari web app:

| Source (Web) | Destination (Mobile) | Notes |
|--------------|---------------------|-------|
| `src/utils/analytics.js` | `shared/utils/analytics.ts` | Add types |
| `src/utils/tariff.js` | `shared/utils/tariff.ts` | Add types |
| `src/utils/settings.js` | `shared/utils/settings.ts` | Add types |
| `src/utils/rupiah.js` | `shared/utils/rupiah.ts` | Add types |
| `src/utils/date.js` | `shared/utils/date.ts` | Add types |
| `src/utils/localeFormatter.js` | `shared/utils/localeFormatter.ts` | Add types |
| `src/utils/validationService.js` | `shared/utils/validationService.ts` | Add types |
| `src/i18n/locales/en.json` | `shared/i18n/en.json` | Direct copy |
| `src/i18n/locales/id.json` | `shared/i18n/id.json` | Direct copy |

---

## 📝 Notes

- **Legend**: ⬜ Not Started | 🔄 In Progress | ✅ Done
- **Perkiraan code reuse**: ~65% dari web app
- **Framework**: React Native + Expo SDK 52
- **Bahasa**: TypeScript
