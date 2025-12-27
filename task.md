# CatatToken.ID Mobile - Development Tasks

> 📱 React Native + Expo Implementation Tracker
> Timeline: 5-6 minggu | Target: Android + iOS

---

## 📌 Phase 1: Foundation (Week 1) ✅ COMPLETED

### 1.1 Project Setup
- [x] Initialize Expo project dengan TypeScript
- [x] Setup folder structure sesuai plan
- [x] Install core dependencies
- [x] Configure `app.json` (scheme, bundleIdentifier, package)
- [x] Setup `.env` untuk Supabase credentials
- [x] Configure `tsconfig.json`

### 1.2 Supabase & Storage
- [x] Install `@supabase/supabase-js`
- [x] Install `@react-native-async-storage/async-storage`
- [x] Install `react-native-url-polyfill`
- [x] Create `lib/supabase.ts` dengan AsyncStorage adapter
- [x] Create `lib/storage.ts` helpers

### 1.3 Auth - Login
- [x] Create `contexts/AuthContext.tsx`
- [x] Create `app/_layout.tsx` dengan providers
- [x] Create `app/(auth)/_layout.tsx`
- [x] Create `app/(auth)/login.tsx`
- [x] Create `components/auth/LoginForm.tsx`
- [x] Implement email/password login

### 1.4 Auth - Register & Password Reset
- [x] Create `app/(auth)/register.tsx`
- [x] Create `components/auth/RegisterForm.tsx`
- [x] Create `app/(auth)/forgot-password.tsx`
- [x] Create `components/auth/PasswordResetForm.tsx`
- [x] Test registration flow
- [x] Test password reset email

### 1.5 Auth - Google OAuth
- [x] Configure deep linking di `app.json`
- [x] Create `components/auth/GoogleSignInButton.tsx`
- [x] Setup URL scheme handler
- [x] Test Google OAuth redirect
- [x] Handle auth callback

---

## 📌 Phase 2: Input Form (Week 2) ✅ COMPLETED

### 2.1 Input Screen Layout
- [x] Create `app/(tabs)/_layout.tsx` (Tab Navigator)
- [x] Create `app/(tabs)/input.tsx`
- [x] Create `components/input/TabSelector.tsx`
- [x] Style mode toggle (Reading: Blue, TopUp: Yellow)

### 2.2 Reading Form
- [x] Create `components/input/ReadingForm.tsx`
- [x] Implement date/time picker (native)
- [x] Implement kWh input dengan validation
- [x] Create `components/input/ConsumptionPreview.tsx`
- [x] Implement notes input
- [x] Add submit dengan loading state

### 2.3 TopUp Form
- [x] Create `components/input/TopUpForm.tsx`
- [x] Implement token cost input (Rupiah)
- [x] Implement smart pre-fill calculation
- [x] Copy `shared/utils/tariff.ts` dari web
- [x] Copy `shared/utils/settings.ts` dari web
- [x] Test pre-fill accuracy

### 2.4 Photo Capture
- [x] Install `expo-image-picker`
- [x] Install `expo-camera`
- [x] Create `components/input/PhotoCapture.tsx`
- [x] Implement camera capture
- [x] Implement gallery picker
- [x] Handle image compression (quality: 0.7)

### 2.5 Input Modals
- [x] Create `components/modals/DuplicateDateModal.tsx`
- [x] Create `components/modals/ReadingAnomalyModal.tsx`
- [x] Implement duplicate date detection
- [x] Implement anomaly detection (sudden drops/spikes)
- [x] Test modal interactions

---

## 📌 Phase 3: Dashboard (Week 3) ✅ COMPLETED

### 3.1 Dashboard Layout
- [x] Create `app/(tabs)/index.tsx` (Dashboard)
- [x] Create `components/dashboard/GlobalFilterBar.tsx`
- [x] Implement Day/Week/Month toggle
- [x] Setup ScrollView layout

### 3.2 Summary Cards
- [x] Install `victory-native` dan `react-native-svg`
- [x] Create `components/dashboard/TotalUsageCard.tsx`
- [x] Implement bar chart dengan Victory
- [x] Create `components/dashboard/EstCostCard.tsx`
- [x] Implement budget progress bar
- [x] Create `components/dashboard/TokenPredictionCard.tsx` (TokenBurnRateChart)
- [x] Display remaining kWh dan days

### 3.3 Consumption Chart
- [x] Create `components/dashboard/ConsumptionChart.tsx` (TotalUsageCard)
- [x] Implement Area chart for Day filter (Today vs Yesterday)
- [x] Implement Bar chart for Week filter
- [x] Implement Line chart for Month filter
- [x] Add top-up event markers (yellow)
- [x] Copy `shared/utils/analytics.ts` dari web

### 3.4 Balance & History Charts
- [x] Create `components/dashboard/TokenBalanceChart.tsx`
- [x] Create `components/dashboard/MonthlyHistoryChart.tsx` (integrated in TotalUsageCard)
- [x] Style charts sesuai filter
- [x] Test chart responsiveness

### 3.5 Alerts & Recent Readings
- [x] Create `components/dashboard/AlertBox.tsx`
- [x] Implement high usage warnings
- [x] Create `components/dashboard/RecentReadingsList.tsx`
- [x] Display last 5 readings
- [x] Implement pull-to-refresh

---

## 📌 Phase 4: History & Settings (Week 4) ✅ COMPLETED

### 4.1 History Screen
- [x] Create `app/(tabs)/history.tsx`
- [x] Create `components/history/HistoryList.tsx` (FlatList)
- [x] Create `components/history/ReadingItem.tsx`
- [x] Create `components/history/TypeBadge.tsx`
- [x] Implement virtualized list

### 4.2 History Filters
- [x] Create `components/history/HistoryFilters.tsx`
- [x] Implement search filter
- [x] Implement date range filter (30d/12m/All)
- [x] Implement type filter (All/Reading/TopUp)
- [x] Implement page-based pagination

### 4.3 History Modals
- [x] Create `components/modals/EditReadingModal.tsx`
- [x] Implement mode-locked editing
- [x] Create `components/modals/DeleteConfirmModal.tsx`
- [x] Create `components/modals/ImageViewerModal.tsx`
- [x] Test edit/delete flows

### 4.4 Settings Screen
- [x] Create `app/(tabs)/settings.tsx`
- [x] Create `components/settings/ProfileCard.tsx`
- [x] Display avatar, name, email
- [x] Implement edit display name

### 4.5 Settings - Base Fees & Budget
- [x] Create `components/settings/BaseFeesConfig.tsx`
- [x] Implement admin fee input
- [x] Implement tax percentage input
- [x] Create `components/settings/BudgetConfig.tsx`
- [x] Implement monthly budget input
- [x] Implement alert threshold slider
- [x] Save configuration to Supabase


---

## 📌 Phase 5: Polish & Features (Week 5) ⬜ NOT STARTED

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
- [x] Install `expo-blur` dan `expo-font`
- [x] Install `react-native-reanimated` dan `react-native-gesture-handler`
- [x] Install `lucide-react-native`
- [x] Create `components/ui/GlassCard.tsx`
- [x] Create `components/ui/GradientButton.tsx`
- [x] Create `components/ui/Input.tsx`
- [ ] Create `components/ui/LoadingSpinner.tsx`
- [ ] Create `components/ui/Toast.tsx`
- [x] Add entry/exit animations
- [ ] Polish all screens

---

## 📌 Phase 6: Testing & Release (Week 6) ⬜ NOT STARTED

### 6.1 Bug Fixes
- [ ] Test all auth flows
- [ ] Test all input scenarios
- [ ] Test chart rendering di berbagai screen sizes
- [ ] Test history pagination
- [ ] Test settings persistence
- [ ] Fix edge cases

### 6.2 EAS Build Configuration
- [x] Create `eas.json`
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
| Phase 1: Foundation | ✅ Completed | 28/28 |
| Phase 2: Input Form | ✅ Completed | 25/25 |
| Phase 3: Dashboard | ✅ Completed | 22/22 |
| Phase 4: History & Settings | ✅ Completed | 24/24 |
| Phase 5: Polish & Features | 🔄 Partial | 7/25 |
| Phase 6: Testing & Release | ⬜ Not Started | 1/15 |
| **Total** | 🔄 | **107/139** |

---

## 🔄 Shared Code dari Web (Copy Langsung)

Berikut file-file yang bisa di-copy 100% dari web app:

| Source (Web) | Destination (Mobile) | Status |
|--------------|---------------------|--------|
| `src/utils/analytics.js` | `shared/utils/analytics.ts` | ✅ Done |
| `src/utils/tariff.js` | `shared/utils/tariff.ts` | ✅ Done |
| `src/utils/settings.js` | `shared/utils/settings.ts` | ✅ Done |
| `src/utils/rupiah.js` | `shared/utils/rupiah.ts` | ✅ Done |
| `src/utils/date.js` | `shared/utils/date.ts` | ✅ Done |
| `src/utils/localeFormatter.js` | `shared/utils/localeFormatter.ts` | ⬜ Pending |
| `src/utils/validationService.js` | `shared/utils/validationService.ts` | ⬜ Pending |
| `src/i18n/locales/en.json` | `shared/i18n/en.json` | ⬜ Pending |
| `src/i18n/locales/id.json` | `shared/i18n/id.json` | ⬜ Pending |

---

## 📝 Notes

- **Legend**: ⬜ Not Started | 🔄 In Progress | ✅ Done
- **Perkiraan code reuse**: ~65% dari web app
- **Framework**: React Native + Expo SDK 52
- **Bahasa**: TypeScript
- **Last Updated**: 27 December 2024
