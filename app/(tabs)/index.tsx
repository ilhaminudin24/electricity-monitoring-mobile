
import React, { useState, useEffect, useCallback } from 'react';
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
    TokenPredictionCard,
    TokenBalanceChart,
    UsageAlert,
    RecentReadingsList,
    EfficiencyScoreCard,
    TokenBurnRateChart,
} from '@/components/dashboard';

// Analytics Utils
import {
    Reading,
    computeDailyUsage,
    aggregateWeekly,
    aggregateMonthly,
    calculateTokenPrediction,
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

    // Compute basic analytics data
    // Use 60 days for trend comparisons
    const dailyUsage = computeDailyUsage(readings, 60);

    // Calculate Trend Percentage
    const calculateTrend = () => {
        if (dailyUsage.length === 0) return 0;

        let currentSum = 0;
        let previousSum = 0;

        // Sort descending (newest first) for easier slicing
        const sorted = [...dailyUsage].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (filter === 'day') {
            // Compare last 7 days vs previous 7 days (as per reference logic for 'Day' filter view which shows 7 days)
            // Wait, reference says: "Day: shows 7 days".
            // So current period = last 7 days. Previous period = 7 days before that.
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
            // Compare last 30 days (appr 1 month) vs previous 30 days
            // Or compare this month vs last month strict?
            // Reference usually compares 30-day windows for simplicity in rolling analytics
            const currentPeriod = sorted.slice(0, 30);
            const previousPeriod = sorted.slice(30, 60);
            currentSum = currentPeriod.reduce((acc, d) => acc + d.usage, 0);
            previousSum = previousPeriod.reduce((acc, d) => acc + d.usage, 0);
        }

        if (previousSum === 0) return 0;
        return ((currentSum - previousSum) / previousSum) * 100;
    };

    const trendPercentage = calculateTrend();

    // Prepare chart data based on filter
    // Note: filterByTimeRange might need adjustment if we changed the meaning of 'day'/'week'/'month'
    // Reference:
    // Day -> Last 7 Days
    // Week -> Last 4 Weeks (aggregated or daily?) -> Reference says "4 weeks aggregated" usually means weekly bars?
    // Let's check prepareChartData in analytics.ts.
    // It handles the slicing. We just pass dailyUsage.

    const chartData = prepareChartData(dailyUsage, filter);

    // Calculate total usage for display
    // Must match the chart data range
    const totalUsage = chartData.reduce((sum, d) => sum + (d.y || 0), 0);

    // Advanced Analytics
    const tokenPrediction = calculateTokenPrediction(readings);
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

            {/* 1. Total Usage Card */}
            <TotalUsageCard
                totalKwh={totalUsage}
                trendPercentage={Number(trendPercentage.toFixed(1))}
                data={chartData}
                filter={filter}
                loading={loading}
            />

            {/* 2. Efficiency Score Card */}
            <EfficiencyScoreCard
                score={efficiencyScore}
                hasData={efficiencyScore.hasData}
                loading={loading}
            />

            {/* 3. Estimated Cost Card */}
            <EstCostCard
                estimatedCost={estimatedCost}
                budgetMonthly={budgetForPeriod}
                alertThreshold={alertThreshold}
                loading={loading}
            />

            {/* 4. Token Burn Rate Chart (Area Chart) */}
            <TokenBurnRateChart
                burnRateData={burnRateProjection}
                loading={loading}
            />

            {/* 5. Token Prediction Card (Simple Stats) - Optional/Complementary */}
            <TokenPredictionCard
                prediction={tokenPrediction}
                loading={loading}
            />

            {/* 6. Token Balance History Chart */}
            <TokenBalanceChart
                dailyData={dailyUsage}
                loading={loading}
            />

            {/* 7. Recent Readings List */}
            <RecentReadingsList
                readings={readings}
                loading={loading}
            />
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
