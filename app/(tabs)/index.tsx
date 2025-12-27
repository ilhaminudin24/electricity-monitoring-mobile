
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { loadSettings, DEFAULT_SETTINGS, Settings } from '@/shared/utils/settings';

// Dashboard Components
import {
    GlobalFilterBar,
    TotalUsageCard,
    EstCostCard,
    TokenBalanceChart,
    UsageAlert,
    RecentReadingsList,
    EfficiencyScoreCard,
    TokenBurnRateChart,
    SectionHeader,
    AnimatedCard,
} from '@/components/dashboard';

// Analytics Utils
import {
    Reading,
    computeDailyUsage,
    aggregateWeekly,
    aggregateMonthly,
    prepareChartData,
    filterByTimeRange,
    calculateBurnRateProjection,
    calculateEfficiencyScore,
} from '@/shared/utils/analytics';

type FilterType = 'day' | 'week' | 'month';

export default function DashboardScreen() {
    const { user } = useAuth();

    // State
    const [filter, setFilter] = useState<FilterType>('week');
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    // Fetch readings from Supabase
    const fetchReadings = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('electricity_readings')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true })
                .limit(1000);

            if (error) throw error;
            setReadings(data || []);
        } catch (error) {
            console.error('Error fetching readings:', error);
        }
    }, [user]);

    // Load settings
    const fetchSettings = useCallback(async () => {
        const loaded = await loadSettings();
        setSettings(loaded);
    }, []);

    // Initial load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchReadings(), fetchSettings()]);
            setLoading(false);
        };
        init();
    }, [fetchReadings, fetchSettings]);

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchReadings(), fetchSettings()]);
        setRefreshing(false);
    }, [fetchReadings, fetchSettings]);

    // Compute basic analytics data (memoized)
    const dailyUsage = useMemo(() => computeDailyUsage(readings, 180), [readings]);

    // Calculate Trend Percentage based on current filter
    const trendPercentage = useMemo(() => {
        if (dailyUsage.length === 0) return 0;

        let currentSum = 0;
        let previousSum = 0;

        // Sort descending (newest first) for easier slicing
        const sorted = [...dailyUsage].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (filter === 'day') {
            // Compare last 7 days vs previous 7 days
            const currentPeriod = sorted.slice(0, 7);
            const previousPeriod = sorted.slice(7, 14);
            currentSum = currentPeriod.reduce((acc, d) => acc + d.usage, 0);
            previousSum = previousPeriod.reduce((acc, d) => acc + d.usage, 0);
        } else if (filter === 'week') {
            // Compare last 4 weeks (28 days) vs previous 4 weeks
            const currentPeriod = sorted.slice(0, 28);
            const previousPeriod = sorted.slice(28, 56);
            currentSum = currentPeriod.reduce((acc, d) => acc + d.usage, 0);
            previousSum = previousPeriod.reduce((acc, d) => acc + d.usage, 0);
        } else if (filter === 'month') {
            // Compare last 6 months worth of data vs previous 6 months
            const currentPeriod = sorted.slice(0, 180);
            const previousPeriod = sorted.slice(180, 360);
            currentSum = currentPeriod.reduce((acc, d) => acc + d.usage, 0);
            previousSum = previousPeriod.reduce((acc, d) => acc + d.usage, 0);
        }

        if (previousSum === 0) return 0;
        return ((currentSum - previousSum) / previousSum) * 100;
    }, [dailyUsage, filter]);

    // Prepare chart data based on filter (memoized)
    const chartData = useMemo(() => prepareChartData(dailyUsage, filter), [dailyUsage, filter]);

    // Calculate total usage for display - must match the chart data
    const totalUsage = useMemo(() => chartData.reduce((sum, d) => sum + (d.y || 0), 0), [chartData]);

    // Advanced Analytics

    const burnRateProjection = calculateBurnRateProjection(readings);
    const efficiencyScore = calculateEfficiencyScore(readings, {
        monthlyBudget: settings.monthlyBudget,
        tariffPerKwh: settings.tariffPerKwh
    });

    // Estimated Cost
    const tariffRate = settings.useGlobalTariffTiers
        ? (settings.tariffPerKwh || 1444.70)
        : settings.tariffPerKwh;
    const estimatedCost = totalUsage * tariffRate;

    // Budget calculations
    const budgetMonthly = settings.monthlyBudget || 300000;
    // Adjust budget based on view? 
    // Reference EstCostCard usually shows monthly projection or actual cost vs budget.
    // For simplicity, we compare calculated cost vs pro-rated budget if 'day', or full budget?
    // Let's stick to pro-rated for consistency with cost being shown.
    const budgetForPeriod = filter === 'day' ? (budgetMonthly / 30) * 7 : filter === 'week' ? budgetMonthly : budgetMonthly;
    // ^ Approximations.

    const budgetPercentage = budgetForPeriod > 0 ? (estimatedCost / budgetForPeriod) * 100 : 0;
    const alertThreshold = settings.budgetAlertThreshold || 80;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.welcome}>
                    Selamat Datang, {user?.display_name || 'User'}! 👋
                </Text>
                <Text style={styles.subtitle}>
                    Pantau penggunaan listrik Anda
                </Text>
            </View>

            {/* Global Filter Bar */}
            <GlobalFilterBar filter={filter} onFilterChange={setFilter} />

            {/* Usage Alert */}
            {!alertDismissed && (
                <UsageAlert
                    percentage={budgetPercentage}
                    threshold={alertThreshold}
                    onDismiss={() => setAlertDismissed(true)}
                />
            )}

            {/* ========== SECTION: RINGKASAN ========== */}
            <SectionHeader emoji="📊" title="Ringkasan" />

            {/* 1. Total Usage Card - Hero metric */}
            <AnimatedCard delay={0}>
                <TotalUsageCard
                    totalKwh={totalUsage}
                    trendPercentage={Number(trendPercentage.toFixed(1))}
                    data={chartData}
                    filter={filter}
                    loading={loading}
                />
            </AnimatedCard>

            {/* 2. Estimated Cost Card - Cost context */}
            <AnimatedCard delay={50}>
                <EstCostCard
                    estimatedCost={estimatedCost}
                    budgetMonthly={budgetForPeriod}
                    alertThreshold={alertThreshold}
                    loading={loading}
                />
            </AnimatedCard>

            {/* 3. Efficiency Score Card - Insight */}
            <AnimatedCard delay={100}>
                <EfficiencyScoreCard
                    score={efficiencyScore}
                    hasData={efficiencyScore.hasData}
                    loading={loading}
                />
            </AnimatedCard>

            {/* ========== SECTION: PROYEKSI TOKEN ========== */}
            <SectionHeader emoji="⚡" title="Proyeksi Token" subtitle="Berdasarkan rata-rata 30 hari" />

            {/* 4. Token Burn Rate Chart (Area Chart) */}
            <AnimatedCard delay={150}>
                <TokenBurnRateChart
                    burnRateData={burnRateProjection}
                    loading={loading}
                />
            </AnimatedCard>

            {/* 5. Token Balance History Chart */}
            <AnimatedCard delay={200}>
                <TokenBalanceChart
                    dailyData={dailyUsage}
                    loading={loading}
                />
            </AnimatedCard>

            {/* ========== SECTION: RIWAYAT ========== */}
            <SectionHeader emoji="📋" title="Riwayat" subtitle="Catatan terbaru Anda" />

            {/* 6. Recent Readings List */}
            <AnimatedCard delay={250}>
                <RecentReadingsList
                    readings={readings}
                    loading={loading}
                />
            </AnimatedCard>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: 24,
        paddingTop: 60,
    },
    welcome: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 4,
    },
});

