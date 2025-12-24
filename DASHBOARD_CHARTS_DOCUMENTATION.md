# Dashboard Charts Documentation

Dokumentasi komprehensif tentang semua chart dan komponen visualisasi yang ada di Dashboard aplikasi **CatatToken.ID** (Electricity Monitoring).

---

## 📊 Daftar Isi

1. [Overview Arsitektur](#overview-arsitektur)
2. [Data Source & Tabel Database](#data-source--tabel-database)
3. [Analytics Utilities](#analytics-utilities)
4. [Komponen Chart](#komponen-chart)
   - [TotalUsageCard](#1-totalusagecard)
   - [EstCostCard](#2-estcostcard)
   - [TokenPredictionCard](#3-tokenpredictioncard)
   - [EfficiencyScoreCard](#4-efficiencyscorecard)
   - [TokenBurnRateChart](#5-tokenburnratechart)
   - [TokenBalanceHistoryCard](#6-tokenbalancehistorycard)
   - [AlertBox](#7-alertbox)
5. [Global Filter System](#global-filter-system)
6. [Data Flow Diagram](#data-flow-diagram)

---

## Overview Arsitektur

### Struktur File

```
frontend/src/
├── pages/
│   └── Dashboard.jsx              # Halaman utama dashboard
├── components/dashboard/
│   ├── TotalUsageCard.jsx         # Card konsumsi total + bar chart
│   ├── EstCostCard.jsx            # Card estimasi biaya + progress bar
│   ├── TokenPredictionCard.jsx    # Card prediksi token + gauge
│   ├── EfficiencyScoreCard.jsx    # Card skor efisiensi + ring chart
│   ├── TokenBurnRateChart.jsx     # Area chart proyeksi burn rate
│   ├── TokenBalanceHistoryCard.jsx # Line chart histori saldo token
│   ├── AlertBox.jsx               # Alert deteksi anomali
│   ├── GlobalFilterBar.jsx        # Filter Day/Week/Month
│   ├── MainUsageChart.jsx         # Wrapper chart (deprecated layout)
│   └── RecentReadingsList.jsx     # List 5 pembacaan terakhir
├── services/
│   └── supabaseService.js         # Service untuk query database
└── utils/
    ├── analytics.js               # Fungsi kalkulasi analytics
    ├── settings.js                # Pengaturan user (tarif, budget)
    └── energy/
        ├── computeDailyUsage.js   # Kalkulasi konsumsi harian
        ├── aggregateWeekly.js     # Agregasi mingguan
        └── aggregateMonthly.js    # Agregasi bulanan
```

### Library yang Digunakan

| Library | Versi | Fungsi |
|---------|-------|--------|
| **Recharts** | ^2.x | Line charts, Area charts, Bar charts |
| **date-fns** | ^3.x | Format dan manipulasi tanggal |
| **lucide-react** | ^0.x | Icons |

---

## Data Source & Tabel Database

### Tabel: `electricity_readings`

Tabel utama yang menyimpan semua data pembacaan meter listrik.

```sql
CREATE TABLE electricity_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    kwh_value DECIMAL(10, 2) NOT NULL,  -- Sisa kWh (remaining balance)
    token_cost DECIMAL(12, 2),          -- Biaya top-up (jika ada)
    token_amount DECIMAL(10, 2),        -- Jumlah kWh top-up (jika ada)
    notes TEXT,
    meter_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Field Penting

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `kwh_value` | DECIMAL | **Sisa kWh yang tersisa** (bukan konsumsi). Berkurang seiring pemakaian. |
| `token_cost` | DECIMAL | Biaya pembelian token (Rp), diisi saat top-up |
| `token_amount` | DECIMAL | Jumlah kWh yang dibeli saat top-up |
| `date` | TIMESTAMPTZ | Tanggal & waktu pembacaan |

> ⚠️ **PENTING**: `kwh_value` adalah **saldo yang tersisa**, bukan konsumsi. Untuk menghitung konsumsi, gunakan formula:  
> `konsumsi = pembacaan_sebelumnya - pembacaan_sekarang`

### Tabel: `user_profiles`

Menyimpan pengaturan user termasuk tarif listrik dan budget.

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    display_name TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    tariff_settings JSONB,  -- Pengaturan tarif & budget
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Struktur `tariff_settings` (JSONB)

```json
{
  "tariffPerKwh": 1444.70,      // Tarif per kWh (Rp)
  "monthlyBudget": 500000,       // Budget bulanan (Rp)
  "budgetAlertThreshold": 80     // Ambang peringatan budget (%)
}
```

---

## Analytics Utilities

### File: `utils/analytics.js`

#### 1. `calculateDailyUsage(readings, days = 30)`

Menghitung konsumsi harian dari data pembacaan.

```javascript
// Input: Array readings dari database
// Output: Array { date, usage_kwh, meterValue, isTopUp }

const dailyUsage = calculateDailyUsage(readings, 60);
// Returns: [
//   { date: "2024-12-23", usage_kwh: 3.5, meterValue: 150.00, isTopUp: false },
//   { date: "2024-12-22", usage_kwh: 4.2, meterValue: 153.50, isTopUp: true },
//   ...
// ]
```

**Logika Kalkulasi** (dari `computeDailyUsage.js`):
1. Sort readings by date ascending
2. Untuk setiap pasangan readings:
   - `consumption = prev.kwh_value - next.kwh_value`
   - Jika negative (meter naik) = Top-up, set consumption = 0
3. Distribusikan konsumsi merata ke gap hari
4. Return sorted by date descending (newest first)

---

#### 2. `calculateWeeklyUsage(readings, weeks = 12)`

Agregasi data mingguan dari data harian.

```javascript
// Output: [
//   { 
//     startDate: "2024-12-16", 
//     endDate: "2024-12-22", 
//     usage_kwh: 25.5,
//     avgDailyUsage: 3.64 
//   },
//   ...
// ]
```

---

#### 3. `calculateMonthlyUsage(readings, months = 12)`

Agregasi data bulanan dari data harian.

```javascript
// Output: [
//   { 
//     month: "2024-12", 
//     monthName: "December",
//     usage_kwh: 105.3 
//   },
//   ...
// ]
```

---

#### 4. `calculateTokenPrediction(readings)`

Menghitung prediksi habisnya token.

```javascript
// Output: {
//   hasToken: true,
//   currentToken: 150.5,          // kWh tersisa
//   remainingKwh: 150.5,
//   avgDailyUsage: 3.8,           // Rata-rata konsumsi per hari
//   daysUntilDepletion: 39,       // Hari sampai habis
//   predictedDepletionDate: "2024-01-31",
//   costPerKwh: 1444.70,
//   estimatedMonthlyCost: 165000
// }
```

**Logika**:
1. Ambil `latestReading.kwh_value` sebagai sisa kWh
2. Hitung rata-rata konsumsi 30 hari terakhir
3. `daysUntilDepletion = remainingKwh / avgDailyUsage`

---

#### 5. `calculateBurnRateProjection(readings)`

Menghasilkan data proyeksi untuk grafik Token Burn Rate.

```javascript
// Output: {
//   hasData: true,
//   projectionData: [
//     { date: "2024-12-23", kwhRemaining: 150.5, isActual: true, dayIndex: 0 },
//     { date: "2024-12-24", kwhRemaining: 146.7, isActual: false, dayIndex: 1 },
//     ... // sampai kWh = 0 atau maxDays = 60
//   ],
//   remainingKwh: 150.5,
//   avgDailyUsage: 3.8,
//   daysUntilDepletion: 39,
//   predictedDepletionDate: "2024-01-31",
//   criticalKwh: 11.4,    // 3 hari × avgDailyUsage
//   warningKwh: 26.6,     // 7 hari × avgDailyUsage
//   isCritical: false,
//   isWarning: false
// }
```

**Threshold Zones**:
- 🟢 **Safe**: > 7 hari tersisa
- 🟡 **Warning**: 3-7 hari tersisa
- 🔴 **Critical**: ≤ 3 hari tersisa

---

#### 6. `calculateEfficiencyScore(readings, settings)`

Menghitung skor efisiensi (gamification) dengan 3 komponen.

```javascript
// Output: {
//   hasData: true,
//   totalScore: 78,
//   grade: "B",
//   consistencyScore: 24,   // Maks 30
//   budgetScore: 32,        // Maks 40
//   trendScore: 22,         // Maks 30
//   breakdown: {
//     consistency: { cv: 25.3, mean: 3.8, stdDev: 0.96 },
//     budget: { pacingRatio: 0.85, budgetUsedPct: 45 },
//     trend: { changePct: -5.2, thisWeek: 25, lastWeek: 26.4 }
//   },
//   tips: ["budget"]  // Tips untuk perbaikan
// }
```

**Komponen Skor**:

| Komponen | Maks Poin | Metrik | Logika |
|----------|-----------|--------|--------|
| **Consistency** | 30 | Coefficient of Variation (CV) | CV < 15% = 30pts, < 25% = 24pts, < 40% = 18pts, else < 12pts |
| **Budget** | 40 | Pacing Ratio | < 0.8 = 40pts, < 1.0 = 32pts, < 1.2 = 24pts, else < 16pts |
| **Trend** | 30 | Week-over-week change | < -10% = 30pts, < -5% = 25pts, ±5% = 20pts, > +10% = 6pts |

**Grade System**:
- A+ : 90-100
- A  : 80-89
- B  : 70-79
- C  : 60-69
- D  : 50-59
- F  : < 50

---

## Komponen Chart

### 1. TotalUsageCard

**File**: `components/dashboard/TotalUsageCard.jsx`

**Tampilan**: Card dengan angka total konsumsi + Bar Chart mini

**Library Chart**: Recharts `BarChart`, `Bar`, `XAxis`, `Tooltip`, `Cell`

#### Props

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `totalKwh` | number | Total konsumsi dalam kWh |
| `trendPercentage` | number | Persentase perubahan vs periode sebelumnya |
| `chartData` | array | Data untuk bar chart |
| `timeRange` | string | 'day' \| 'week' \| 'month' |

#### Data Structure

```javascript
chartData = [
  { name: "Mon 18", value: 3.5, isTopUp: false },
  { name: "Tue 19", value: 4.2, isTopUp: false },
  { name: "Wed 20", value: 0.0, isTopUp: true },   // Top-up (biru)
  { name: "Thu 21", value: 3.8, isTopUp: false },
]
```

#### Visualisasi

- Bar terakhir: **hijau** (#10b981)
- Bar lainnya: **abu-abu** (#e5e7eb)
- Bar top-up: **biru** (#3b82f6)
- Trend naik: **hijau** badge
- Trend turun: **merah** badge

#### Data Source

Data diambil dari `filteredUsage.chartData` yang dihitung di `Dashboard.jsx`:
```javascript
// Day filter: last 7 days
chartData = sortedDaily.slice(-7).map(d => ({
  name: formatDate(d.date),
  value: d.usage_kwh,
  isTopUp: d.isTopUp
}));

// Week filter: last 4 weeks
chartData = last4Weeks.map(w => ({
  name: formatWeekLabel(w.startDate, w.endDate),
  value: w.usage_kwh
}));

// Month filter: last 6 months
chartData = last6Months.map(m => ({
  name: m.monthName,
  value: m.usage_kwh
}));
```

---

### 2. EstCostCard

**File**: `components/dashboard/EstCostCard.jsx`

**Tampilan**: Card dengan estimasi biaya + progress bar

**Library Chart**: Pure CSS (progress bar)

#### Props

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `estimatedCost` | number | Estimasi biaya dalam Rupiah |
| `dailyAverageCost` | number | Rata-rata biaya per hari/minggu/bulan |
| `timeRange` | string | 'day' \| 'week' \| 'month' |

#### Logika Kalkulasi

```javascript
// Di Dashboard.jsx
const settings = getSettings();
const tariff = settings.tariffPerKwh || 1444.70;
const filteredCost = totalUsage * tariff;

// Budget per periode
const periodBudget = getBudgetForPeriod(timeRange);
// day: monthlyBudget / 30 * 7
// week: monthlyBudget / 4
// month: monthlyBudget / 6

// Persentase terpakai
const percentage = (estimatedCost / periodBudget) * 100;
```

#### Warna Progress Bar

| Kondisi | Warna |
|---------|-------|
| < 45% budget | 🟢 Hijau (`bg-green-500`) |
| 45-80% budget | 🟡 Kuning (`bg-yellow-500`) |
| > 80% budget | 🔴 Merah (`bg-red-500`) |

---

### 3. TokenPredictionCard

**File**: `components/dashboard/TokenPredictionCard.jsx`

**Tampilan**: Card dengan gauge visual + CTA button

**Library Chart**: SVG Circle (custom gauge)

#### Props

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `daysRemaining` | number | Hari tersisa sampai token habis |
| `hasToken` | boolean | Apakah ada data token |
| `remainingKwh` | number | Sisa kWh token |

#### SVG Gauge Logic

```javascript
const maxDays = 30;  // 100% = 30 hari
const radius = 40;
const circumference = 2 * Math.PI * radius;
const percentage = Math.min(100, (daysRemaining / maxDays) * 100);
const dashOffset = circumference - (percentage / 100) * circumference;
```

#### Status Colors

| Status | Kondisi | Warna Stroke |
|--------|---------|--------------|
| Critical | ≤ 3 hari | 🔴 `#ef4444` |
| Warning | 3-7 hari | 🟡 `#eab308` |
| Healthy | > 7 hari | 🟢 `#10b981` |
| No Token | - | ⚪ `#94a3b8` |

#### Data Source

```javascript
// Dashboard.jsx
const tokenPred = calculateTokenPrediction(fetchedReadings);
// → daysUntilDepletion, remainingKwh, hasToken
```

---

### 4. EfficiencyScoreCard

**File**: `components/dashboard/EfficiencyScoreCard.jsx`

**Tampilan**: Card dengan ring progress + 3 breakdown cards + tips

**Library Chart**: SVG Circle (ring progress)

#### Props

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `score` | object | Object dari `calculateEfficiencyScore()` |
| `hasData` | boolean | Apakah cukup data untuk kalkulasi |
| `message` | string | Pesan jika tidak ada data |

#### Ring Progress SVG

```javascript
const radius = 40;
const circumference = 2 * Math.PI * radius;
const progress = (totalScore / 100) * circumference;
const offset = circumference - progress;

// SVG stroke-dasharray & stroke-dashoffset untuk animasi
```

#### Breakdown Cards (3 komponen)

| Komponen | Icon | Maks Poin | Penjelasan |
|----------|------|-----------|------------|
| Konsistensi | Activity | 30 | Seberapa stabil pemakaian harian |
| Budget | Wallet | 40 | Apakah sesuai anggaran bulanan |
| Tren | TrendingUp/Down | 30 | Dibanding minggu lalu |

#### Tips Logic

```javascript
// Tips ditampilkan jika skor komponen < threshold
if (consistencyScore < 18) tips.push('consistency');
if (budgetScore < 24) tips.push('budget');
if (trendScore < 20) tips.push('trend');
```

#### Data Source

```javascript
// Dashboard.jsx
const effScore = calculateEfficiencyScore(fetchedReadings, settings);
// → totalScore, grade, consistencyScore, budgetScore, trendScore, tips
```

---

### 5. TokenBurnRateChart

**File**: `components/dashboard/TokenBurnRateChart.jsx`

**Tampilan**: Area chart proyeksi penurunan token + stats row

**Library Chart**: Recharts `AreaChart`, `Area`, `XAxis`, `YAxis`, `ReferenceLine`, `Tooltip`

#### Props

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `projectionData` | array | Data proyeksi dari `calculateBurnRateProjection()` |
| `remainingKwh` | number | Sisa kWh saat ini |
| `daysRemaining` | number | Estimasi hari tersisa |
| `depletionDate` | string | Tanggal perkiraan habis |
| `avgDailyUsage` | number | Rata-rata konsumsi per hari |
| `criticalKwh` | number | Threshold kWh untuk 3 hari |
| `warningKwh` | number | Threshold kWh untuk 7 hari |
| `hasData` | boolean | Apakah ada data |

#### Data Structure

```javascript
projectionData = [
  { date: "2024-12-23", kwhRemaining: 150.5, isActual: true, dayIndex: 0 },
  { date: "2024-12-24", kwhRemaining: 146.7, isActual: false, dayIndex: 1 },
  { date: "2024-12-25", kwhRemaining: 142.9, isActual: false, dayIndex: 2 },
  // ... sampai kwhRemaining = 0 atau dayIndex = 60
];
```

#### Visual Elements

1. **Area Fill**: Gradient berdasarkan status
   - Safe: `#10b981` (emerald)
   - Warning: `#f59e0b` (amber)
   - Critical: `#ef4444` (red)

2. **Reference Lines**:
   - 🟡 Warning line: `y = warningKwh` (7 hari supply)
   - 🔴 Critical line: `y = criticalKwh` (3 hari supply)

3. **Stats Row** (3 kolom):
   - Sisa kWh
   - Hari tersisa
   - Tanggal estimasi habis

4. **Dots**:
   - Titik pertama (actual): Double circle with green fill
   - Titik terakhir: Double circle with status color

#### Kalkulasi Proyeksi

```javascript
// Selalu menggunakan 30-day average (tidak terpengaruh filter)
const avgDailyUsage = validDailyUsage.reduce((a,b) => a+b, 0) / validDailyUsage.length;

// Generate projection points
for (let i = 0; i <= maxProjectionDays; i++) {
  const projectedKwh = Math.max(0, remainingKwh - (avgDailyUsage * i));
  projectionData.push({
    date: projectedDate.toISOString(),
    kwhRemaining: projectedKwh,
    isActual: i === 0,
    dayIndex: i
  });
}
```

> ⚠️ **PENTING**: Proyeksi burn rate **tidak terpengaruh** oleh filter global (Day/Week/Month). Selalu menggunakan rata-rata 30 hari untuk konsistensi prediksi.

---

### 6. TokenBalanceHistoryCard

**File**: `components/dashboard/TokenBalanceHistoryCard.jsx`

**Tampilan**: Line chart histori saldo token 30 hari terakhir

**Library Chart**: Recharts `LineChart`, `Line`, `XAxis`, `YAxis`, `ReferenceLine`, `Tooltip`

#### Props

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `dailyData` | array | Data harian dari `calculateDailyUsage()` |

#### Data Structure

```javascript
// Filter dan siapkan data
const balanceData = dailyData
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .slice(-30)  // Last 30 days
  .filter(d => d.meterValue !== null);

// Struktur tiap data point:
{
  date: "2024-12-23",
  meterValue: 150.5,   // Saldo kWh
  isTopUp: false
}
```

#### Visual Elements

1. **Line**: Emerald (#10b981), strokeWidth 2.5
2. **Top-up Markers**:
   - Vertical dashed line saat top-up
   - Special dot (double circle) pada titik top-up
3. **Axis**:
   - X: Tanggal (format: "dd")
   - Y: kWh
4. **Tooltip**: Menampilkan tanggal, saldo, dan indikator top-up

> ⚠️ Chart ini **tidak terpengaruh** filter global. Selalu menampilkan 30 hari terakhir.

---

### 7. AlertBox

**File**: `components/dashboard/AlertBox.jsx`

**Tampilan**: Alert box merah saat terdeteksi anomali pemakaian

**Library Chart**: Tidak ada (pure component)

#### Props

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `dailyUsage` | array | Data konsumsi harian |

#### Logika Deteksi Spike

```javascript
// Threshold: 50% lebih tinggi dari rata-rata
const threshold = 1.5;

// Ambil data kemarin
const yesterdayEntry = dailyUsage.find(d => d.date === yesterdayStr);
const yesterdayUsage = yesterdayEntry.usage_kwh;

// Hitung rata-rata hari lainnya
const otherDays = dailyUsage.filter(d => d !== yesterdayEntry);
const avgOther = otherDays.reduce((acc, d) => acc + d.usage_kwh, 0) / otherDays.length;

// Deteksi spike
const isSpike = yesterdayUsage > (avgOther * threshold) && yesterdayUsage > 1;
// Minimum 1 kWh untuk menghindari noise
```

#### Kondisi Tampil

Alert **hanya tampil** jika:
1. Ada data minimal 2 hari
2. Ada data untuk kemarin
3. Konsumsi kemarin > 150% rata-rata
4. Konsumsi kemarin > 1 kWh

---

## Global Filter System

**File**: `components/dashboard/GlobalFilterBar.jsx`

### Filter Options

| Filter | Label | Data Range | Trend Comparison |
|--------|-------|------------|------------------|
| `day` | Harian | 7 hari terakhir | 7 hari ini vs 7 hari sebelumnya |
| `week` | Mingguan | 4 minggu terakhir | Minggu ini vs minggu lalu |
| `month` | Bulanan | 6 bulan terakhir | Bulan ini vs bulan lalu |

### Komponen yang Terpengaruh Filter

| Komponen | Terpengaruh? | Detail |
|----------|--------------|--------|
| TotalUsageCard | ✅ Ya | Total, trend, chart data berubah |
| EstCostCard | ✅ Ya | Estimasi biaya dan label periode |
| TokenPredictionCard | ⚠️ Parsial | Tidak terpengaruh (selalu 30-day) |
| EfficiencyScoreCard | ❌ Tidak | Selalu gunakan data 30 hari |
| TokenBurnRateChart | ❌ Tidak | Selalu gunakan rata-rata 30 hari |
| TokenBalanceHistoryCard | ❌ Tidak | Selalu tampilkan 30 hari |
| AlertBox | ❌ Tidak | Deteksi berdasarkan data harian |

### Implementasi di Dashboard.jsx

```javascript
// State
const [usageFilter, setUsageFilter] = useState('week');

// Kalkulasi berdasarkan filter
useEffect(() => {
  if (usageFilter === 'day') {
    // Last 7 days
    total = sumUsage(sortedDaily.slice(-7));
    trend = compare(last7, prev7);
    chartData = last7.map(...);
  } else if (usageFilter === 'week') {
    // Last 4 weeks
    total = last4Weeks.reduce(...);
    trend = compare(thisWeek, lastWeek);
    chartData = last4Weeks.map(...);
  } else if (usageFilter === 'month') {
    // Last 6 months
    total = last6Months.reduce(...);
    trend = compare(thisMonth, lastMonth);
    chartData = last6Months.map(...);
  }
  
  setFilteredUsage({ total, trend, chartData, estimatedCost, dailyAvgCost });
}, [dailyData, weeklyData, monthlyData, usageFilter]);
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE DATABASE                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  electricity_readings                                                │    │
│  │  - id, user_id, date, kwh_value, token_cost, token_amount, notes    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE SERVICE                                   │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  supabaseService.js                                                 │     │
│  │  - getAllReadings(userId, limit=1000)                               │     │
│  │    → Returns: Array of raw readings                                 │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANALYTICS UTILITIES                                │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  analytics.js + energy/*.js                                         │     │
│  │                                                                      │     │
│  │  Raw Readings ───┬──→ computeDailyUsage() ──→ dailyData             │     │
│  │                  │                              │                    │     │
│  │                  │                              ├─→ aggregateWeekly()│     │
│  │                  │                              │   → weeklyData     │     │
│  │                  │                              │                    │     │
│  │                  │                              └─→ aggregateMonthly()    │
│  │                  │                                  → monthlyData    │     │
│  │                  │                                                   │     │
│  │                  ├──→ calculateTokenPrediction() → prediction        │     │
│  │                  ├──→ calculateBurnRateProjection() → burnRateData   │     │
│  │                  └──→ calculateEfficiencyScore() → efficiencyScore   │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DASHBOARD.JSX                                     │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  State Management:                                                  │     │
│  │  - dailyData, weeklyData, monthlyData                               │     │
│  │  - prediction, burnRateData, efficiencyScore                        │     │
│  │  - filteredUsage (berdasarkan usageFilter)                          │     │
│  │                                                                      │     │
│  │  Filter Logic:                                                       │     │
│  │  usageFilter ('day'/'week'/'month') ──→ filteredUsage               │     │
│  │    { total, trend, chartData, estimatedCost, dailyAvgCost }         │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────┐           ┌──────────────────┐          ┌──────────────────┐
│ TotalUsageCard│           │TokenBurnRateChart│          │EfficiencyScore   │
│ - totalKwh    │           │ - projectionData │          │ - score          │
│ - trend       │           │ - remainingKwh   │          │ - grade          │
│ - chartData   │           │ - daysRemaining  │          │ - breakdown      │
│ - timeRange   │           │ - thresholds     │          │ - tips           │
└───────────────┘           └──────────────────┘          └──────────────────┘
        │                             │                             │
        ▼                             ▼                             ▼
    BarChart                     AreaChart                    SVG Ring +
    (Recharts)                   (Recharts)                   Breakdown Cards
```

---

## Catatan Teknis

### 1. Konsumsi = Penurunan Saldo

Berbeda dengan meter PLN konvensional yang naik, sistem ini menggunakan **meter token** yang nilainya **turun** seiring pemakaian.

```javascript
// BENAR
konsumsi = pembacaan_sebelumnya - pembacaan_sekarang

// SALAH (ini untuk meter konvensional)
// konsumsi = pembacaan_sekarang - pembacaan_sebelumnya
```

### 2. Top-Up Detection

Top-up terdeteksi ketika nilai meter **naik** (karena penambahan token):

```javascript
if (prevMeter - nextMeter < 0) {
  // Ini top-up, bukan konsumsi negatif
  isTopUp = true;
  consumption = 0;
}
```

### 3. Gap Filling

Jika tidak ada pembacaan setiap hari, sistem akan **mendistribusikan konsumsi merata**:

```javascript
// Misal: reading tanggal 1 = 100 kWh, tanggal 4 = 91 kWh
// Gap = 3 hari, konsumsi = 9 kWh
// Maka: tanggal 2 = 3 kWh, tanggal 3 = 3 kWh, tanggal 4 = 3 kWh
```

### 4. Performance Optimization

- Data readings dibatasi 1000 record terbaru
- Kalkulasi analytics dilakukan di client-side
- Chart menggunakan `ResponsiveContainer` untuk responsivitas

---

## Referensi File

| File | Path |
|------|------|
| Dashboard | `frontend/src/pages/Dashboard.jsx` |
| TotalUsageCard | `frontend/src/components/dashboard/TotalUsageCard.jsx` |
| EstCostCard | `frontend/src/components/dashboard/EstCostCard.jsx` |
| TokenPredictionCard | `frontend/src/components/dashboard/TokenPredictionCard.jsx` |
| EfficiencyScoreCard | `frontend/src/components/dashboard/EfficiencyScoreCard.jsx` |
| TokenBurnRateChart | `frontend/src/components/dashboard/TokenBurnRateChart.jsx` |
| TokenBalanceHistoryCard | `frontend/src/components/dashboard/TokenBalanceHistoryCard.jsx` |
| AlertBox | `frontend/src/components/dashboard/AlertBox.jsx` |
| GlobalFilterBar | `frontend/src/components/dashboard/GlobalFilterBar.jsx` |
| Analytics | `frontend/src/utils/analytics.js` |
| Compute Daily Usage | `frontend/src/utils/energy/computeDailyUsage.js` |
| Supabase Service | `frontend/src/services/supabaseService.js` |
| Settings Utils | `frontend/src/utils/settings.js` |

---

*Dokumentasi ini dibuat pada 23 Desember 2024*
