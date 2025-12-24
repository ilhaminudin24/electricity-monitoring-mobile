/**
 * Analytics Utilities for CatatToken.ID Mobile
 * Adapted from web app analytics.js with TypeScript types
 */

import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, format, differenceInDays, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Types
export interface Reading {
    id: string;
    user_id: string;
    date: string;
    kwh_value: number;
    token_cost?: number | null;
    token_amount?: number | null;
    notes?: string | null;
    meter_photo_url?: string | null;
    created_at: string;
}

export interface DailyUsage {
    date: string;
    usage: number;
    usage_kwh: number;  // Alias for compatibility with web
    kwhStart: number;
    kwhEnd: number;
    meterValue: number | null;  // Remaining kWh for balance history
    hasTopUp: boolean;
    isTopUp: boolean;  // Alias for compatibility with web
    topUpAmount?: number;
}

export interface WeeklyUsage {
    week: string;
    label: string;
    startDate: string;
    endDate: string;
    usage: number;
    avgDaily: number;
    hasTopUp: boolean;
}

export interface MonthlyUsage {
    month: string;
    label: string;
    usage: number;
    avgDaily: number;
    estCost: number;
    hasTopUp: boolean;
}

export interface TokenPrediction {
    remainingKwh: number;
    avgDailyUsage: number;
    daysRemaining: number;
    predictedDepletionDate: Date | null;
    hasData: boolean;
}

export interface TopUpEvent {
    date: string;
    amount: number;
    cost: number;
}

export interface ChartDataPoint {
    x: string | number;
    y: number;
    name?: string;
    value?: number;
    label?: string;
    hasTopUp?: boolean;
    isTopUp?: boolean;
}

// Burn Rate Projection (for TokenBurnRateChart)
export interface BurnRateProjection {
    hasData: boolean;
    projectionData: Array<{
        date: string;
        kwhRemaining: number;
        isActual: boolean;
        dayIndex: number;
    }>;
    remainingKwh: number;
    avgDailyUsage: number;
    daysUntilDepletion: number | null;
    predictedDepletionDate: string | null;
    criticalKwh: number;
    warningKwh: number;
    daysToCritical: number;
    daysToWarning: number;
    isCritical: boolean;
    isWarning: boolean;
}

// Efficiency Score (for EfficiencyScoreCard)
export interface EfficiencyScore {
    hasData: boolean;
    totalScore: number;
    grade: string;  // A+, A, B, C, D, F
    consistencyScore: number;  // max 30
    budgetScore: number;       // max 40
    trendScore: number;        // max 30
    breakdown: {
        consistency: { mean: number; stdDev: number; cv: number; points: number; maxPoints: number; };
        budget: { monthlyBudget: number; actualCost: number; budgetUsedPct: number; monthProgress: number; pacingRatio: number; points: number; maxPoints: number; };
        trend: { thisWeek: number; lastWeek: number; changePct: number; points: number; maxPoints: number; };
    };
    tips: ('consistency' | 'budget' | 'trend')[];
    message?: string;
}

/**
 * Sort readings by date chronologically (oldest first)
 */
export function sortReadingsChronologically(readings: Reading[]): Reading[] {
    return [...readings].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}

/**
 * Compute daily usage from readings
 * Returns array of daily usage data sorted chronologically
 */
export function computeDailyUsage(readings: Reading[], days: number = 30): DailyUsage[] {
    if (!readings || readings.length < 2) return [];

    const sortedReadings = sortReadingsChronologically(readings);
    const dailyMap = new Map<string, DailyUsage>();

    for (let i = 1; i < sortedReadings.length; i++) {
        const prev = sortedReadings[i - 1];
        const curr = sortedReadings[i];

        const prevKwh = prev.kwh_value;
        const currKwh = curr.kwh_value;
        const dateKey = format(new Date(curr.date), 'yyyy-MM-dd');

        // Check if this is a top-up (kWh increased)
        const isTopUp = currKwh > prevKwh;
        const hasTopUp = curr.token_cost !== null && curr.token_cost !== undefined && curr.token_cost > 0;

        // Calculate usage (negative if top-up, we use absolute for consumption)
        let usage = 0;
        if (!isTopUp) {
            usage = prevKwh - currKwh; // Normal consumption
        }

        const existing = dailyMap.get(dateKey);
        if (existing) {
            existing.usage += usage;
            existing.usage_kwh += usage;
            if (hasTopUp) {
                existing.hasTopUp = true;
                existing.isTopUp = true;
                existing.topUpAmount = (existing.topUpAmount || 0) + (curr.token_amount || 0);
            }
            // Update meterValue to the latest reading
            existing.meterValue = currKwh;
        } else {
            dailyMap.set(dateKey, {
                date: dateKey,
                usage: Math.max(0, usage),
                usage_kwh: Math.max(0, usage),
                kwhStart: prevKwh,
                kwhEnd: currKwh,
                meterValue: currKwh,
                hasTopUp,
                isTopUp: hasTopUp,
                topUpAmount: hasTopUp ? (curr.token_amount || 0) : 0,
            });
        }
    }

    // Sort by date and limit to requested days
    const result = Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return result.slice(-days);
}

/**
 * Aggregate daily usage into weekly data
 */
export function aggregateWeekly(dailyUsage: DailyUsage[], weeks: number = 12): WeeklyUsage[] {
    if (!dailyUsage || dailyUsage.length === 0) return [];

    const weeklyMap = new Map<string, WeeklyUsage>();

    for (const day of dailyUsage) {
        const date = new Date(day.date);
        const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'yyyy-MM-dd');

        const existing = weeklyMap.get(weekKey);
        if (existing) {
            existing.usage += day.usage;
            if (day.hasTopUp) existing.hasTopUp = true;
        } else {
            weeklyMap.set(weekKey, {
                week: weekKey,
                label: `${format(weekStart, 'd MMM', { locale: idLocale })} - ${format(weekEnd, 'd MMM', { locale: idLocale })}`,
                startDate: format(weekStart, 'yyyy-MM-dd'),
                endDate: format(weekEnd, 'yyyy-MM-dd'),
                usage: day.usage,
                avgDaily: 0,
                hasTopUp: day.hasTopUp,
            });
        }
    }

    // Calculate averages and sort
    const result = Array.from(weeklyMap.values())
        .map(week => ({
            ...week,
            avgDaily: week.usage / 7,
        }))
        .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

    return result.slice(-weeks);
}

/**
 * Aggregate daily usage into monthly data
 */
export function aggregateMonthly(dailyUsage: DailyUsage[], months: number = 12): MonthlyUsage[] {
    if (!dailyUsage || dailyUsage.length === 0) return [];

    const monthlyMap = new Map<string, { usage: number; days: number; hasTopUp: boolean }>();

    for (const day of dailyUsage) {
        const monthKey = format(new Date(day.date), 'yyyy-MM');

        const existing = monthlyMap.get(monthKey);
        if (existing) {
            existing.usage += day.usage;
            existing.days += 1;
            if (day.hasTopUp) existing.hasTopUp = true;
        } else {
            monthlyMap.set(monthKey, {
                usage: day.usage,
                days: 1,
                hasTopUp: day.hasTopUp,
            });
        }
    }

    // Convert to array with labels
    const result: MonthlyUsage[] = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
            month,
            label: format(new Date(month + '-01'), 'MMM yyyy', { locale: idLocale }),
            usage: data.usage,
            avgDaily: data.usage / data.days,
            estCost: 0, // Will be calculated with tariff settings
            hasTopUp: data.hasTopUp,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    return result.slice(-months);
}

/**
 * Calculate token prediction based on current balance and average usage
 */
export function calculateTokenPrediction(readings: Reading[]): TokenPrediction {
    const emptyResult: TokenPrediction = {
        remainingKwh: 0,
        avgDailyUsage: 0,
        daysRemaining: 0,
        predictedDepletionDate: null,
        hasData: false,
    };

    if (!readings || readings.length < 2) return emptyResult;

    const sortedReadings = sortReadingsChronologically(readings);
    const latestReading = sortedReadings[sortedReadings.length - 1];
    const dailyUsage = computeDailyUsage(readings, 30);

    if (dailyUsage.length === 0) return emptyResult;

    // Calculate average daily usage (excluding top-up days)
    const consumptionDays = dailyUsage.filter(d => d.usage > 0);
    const avgDailyUsage = consumptionDays.length > 0
        ? consumptionDays.reduce((sum, d) => sum + d.usage, 0) / consumptionDays.length
        : 0;

    const remainingKwh = latestReading.kwh_value;
    const daysRemaining = avgDailyUsage > 0 ? Math.floor(remainingKwh / avgDailyUsage) : 0;
    const predictedDepletionDate = avgDailyUsage > 0
        ? addDays(new Date(), daysRemaining)
        : null;

    return {
        remainingKwh,
        avgDailyUsage,
        daysRemaining,
        predictedDepletionDate,
        hasData: true,
    };
}

/**
 * Detect top-up events from readings
 */
export function detectTopUpEvents(readings: Reading[]): TopUpEvent[] {
    if (!readings) return [];

    return readings
        .filter(r => r.token_cost && r.token_cost > 0)
        .map(r => ({
            date: format(new Date(r.date), 'yyyy-MM-dd'),
            amount: r.token_amount || 0,
            cost: r.token_cost || 0,
        }));
}

/**
 * Filter daily usage based on time filter
 */
export function filterByTimeRange(
    dailyUsage: DailyUsage[],
    filter: 'day' | 'week' | 'month'
): DailyUsage[] {
    const now = new Date();

    switch (filter) {
        case 'day':
            // Today and yesterday
            const yesterday = subDays(now, 1);
            return dailyUsage.filter(d => {
                const date = new Date(d.date);
                return date >= startOfDay(yesterday) && date <= endOfDay(now);
            });

        case 'week':
            // Last 7 days
            const weekAgo = subDays(now, 7);
            return dailyUsage.filter(d => {
                const date = new Date(d.date);
                return date >= startOfDay(weekAgo) && date <= endOfDay(now);
            });

        case 'month':
            // Last 30 days
            const monthAgo = subDays(now, 30);
            return dailyUsage.filter(d => {
                const date = new Date(d.date);
                return date >= startOfDay(monthAgo) && date <= endOfDay(now);
            });

        default:
            return dailyUsage;
    }
}

/**
 * Get today vs yesterday data for day filter chart
 */
export function getTodayVsYesterday(dailyUsage: DailyUsage[]): { today: number; yesterday: number } {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(now, 1), 'yyyy-MM-dd');

    const today = dailyUsage.find(d => d.date === todayStr)?.usage || 0;
    const yesterday = dailyUsage.find(d => d.date === yesterdayStr)?.usage || 0;

    return { today, yesterday };
}

/**
 * Calculate total stats from filtered data
 */
export function calculateStats(dailyUsage: DailyUsage[]) {
    if (!dailyUsage || dailyUsage.length === 0) {
        return { total: 0, average: 0, highest: 0, lowest: 0 };
    }

    const usages = dailyUsage.map(d => d.usage);
    const total = usages.reduce((sum, u) => sum + u, 0);
    const average = total / usages.length;
    const highest = Math.max(...usages);
    const lowest = Math.min(...usages);

    return { total, average, highest, lowest };
}

/**
 * Prepare chart data for Victory Native
 */
export function prepareChartData(
    dailyUsage: DailyUsage[],
    filter: 'day' | 'week' | 'month'
): ChartDataPoint[] {
    switch (filter) {
        case 'day':
            return dailyUsage.slice(-2).map((d, i) => ({
                x: i === 0 ? 'Kemarin' : 'Hari Ini',
                y: d.usage,
                hasTopUp: d.hasTopUp,
            }));

        case 'week':
            return dailyUsage.slice(-7).map(d => ({
                x: format(new Date(d.date), 'EEE', { locale: idLocale }),
                y: d.usage,
                label: format(new Date(d.date), 'd MMM', { locale: idLocale }),
                hasTopUp: d.hasTopUp,
            }));

        case 'month':
            return dailyUsage.slice(-30).map(d => ({
                x: format(new Date(d.date), 'd'),
                y: d.usage,
                label: format(new Date(d.date), 'd MMM', { locale: idLocale }),
                hasTopUp: d.hasTopUp,
            }));

        default:
            return [];
    }
}

/**
 * Calculate burn rate projection for TokenBurnRateChart
 * Generates data points showing projected token depletion over time
 */
export function calculateBurnRateProjection(readings: Reading[]): BurnRateProjection {
    const emptyResult: BurnRateProjection = {
        hasData: false,
        projectionData: [],
        remainingKwh: 0,
        avgDailyUsage: 0,
        daysUntilDepletion: null,
        predictedDepletionDate: null,
        criticalKwh: 0,
        warningKwh: 0,
        daysToCritical: 0,
        daysToWarning: 0,
        isCritical: false,
        isWarning: false,
    };

    if (!readings || readings.length === 0) {
        return emptyResult;
    }

    // Get latest reading for remaining kWh
    const sortedReadings = sortReadingsChronologically(readings);
    const latestReading = sortedReadings[sortedReadings.length - 1];
    const remainingKwh = latestReading?.kwh_value || 0;

    // Calculate daily average from last 30 days (always use 30-day average, no filter)
    const dailyUsage = computeDailyUsage(readings, 30);
    const validDailyUsage = dailyUsage.filter(d => d.usage > 0).map(d => d.usage);
    const avgDailyUsage = validDailyUsage.length > 0
        ? validDailyUsage.reduce((a, b) => a + b, 0) / validDailyUsage.length
        : 0;

    if (avgDailyUsage <= 0 || remainingKwh <= 0) {
        return { ...emptyResult, remainingKwh };
    }

    // Calculate days until depletion
    const daysUntilDepletion = Math.ceil(remainingKwh / avgDailyUsage);

    // Limit projection to max 60 days for chart readability
    const maxProjectionDays = Math.min(daysUntilDepletion, 60);

    // Generate projection data points
    const projectionData: BurnRateProjection['projectionData'] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= maxProjectionDays; i++) {
        const projectedDate = new Date(today);
        projectedDate.setDate(today.getDate() + i);

        const projectedKwh = Math.max(0, remainingKwh - (avgDailyUsage * i));

        projectionData.push({
            date: format(projectedDate, 'yyyy-MM-dd'),
            kwhRemaining: parseFloat(projectedKwh.toFixed(2)),
            isActual: i === 0,
            dayIndex: i,
        });
    }

    // Predicted depletion date
    const depletionDate = new Date(today);
    depletionDate.setDate(today.getDate() + daysUntilDepletion);
    const predictedDepletionDate = format(depletionDate, 'yyyy-MM-dd');

    // Calculate warning thresholds
    const criticalDays = 3;
    const warningDays = 7;
    const criticalKwh = avgDailyUsage * criticalDays;
    const warningKwh = avgDailyUsage * warningDays;

    // Days until reaching critical/warning zones
    const daysToCritical = remainingKwh > criticalKwh
        ? Math.ceil((remainingKwh - criticalKwh) / avgDailyUsage)
        : 0;
    const daysToWarning = remainingKwh > warningKwh
        ? Math.ceil((remainingKwh - warningKwh) / avgDailyUsage)
        : 0;

    return {
        hasData: true,
        projectionData,
        remainingKwh: parseFloat(remainingKwh.toFixed(2)),
        avgDailyUsage: parseFloat(avgDailyUsage.toFixed(2)),
        daysUntilDepletion,
        predictedDepletionDate,
        criticalKwh: parseFloat(criticalKwh.toFixed(2)),
        warningKwh: parseFloat(warningKwh.toFixed(2)),
        daysToCritical,
        daysToWarning,
        isCritical: daysUntilDepletion <= criticalDays,
        isWarning: daysUntilDepletion <= warningDays && daysUntilDepletion > criticalDays,
    };
}

/**
 * Calculate Efficiency Score (Gamification)
 * Score 0-100 based on 3 components:
 * - Consistency (30 pts): How stable is daily usage?
 * - Budget (40 pts): Is spending on track with budget?
 * - Trend (30 pts): Is usage decreasing week-over-week?
 */
export function calculateEfficiencyScore(
    readings: Reading[],
    settings: { monthlyBudget?: number; tariffPerKwh?: number } = {}
): EfficiencyScore {
    const emptyResult: EfficiencyScore = {
        hasData: false,
        totalScore: 0,
        grade: '-',
        consistencyScore: 0,
        budgetScore: 0,
        trendScore: 0,
        breakdown: {
            consistency: { mean: 0, stdDev: 0, cv: 0, points: 0, maxPoints: 30 },
            budget: { monthlyBudget: 0, actualCost: 0, budgetUsedPct: 0, monthProgress: 0, pacingRatio: 0, points: 0, maxPoints: 40 },
            trend: { thisWeek: 0, lastWeek: 0, changePct: 0, points: 0, maxPoints: 30 },
        },
        tips: [],
        message: 'Butuh minimal 7 hari data',
    };

    if (!readings || readings.length < 7) {
        return emptyResult;
    }

    // Get daily usage data
    const dailyUsage = computeDailyUsage(readings, 60);

    if (dailyUsage.length < 7) {
        return { ...emptyResult, message: 'Data harian tidak cukup' };
    }

    const result: EfficiencyScore = {
        hasData: true,
        consistencyScore: 0,
        budgetScore: 0,
        trendScore: 0,
        totalScore: 0,
        grade: '',
        breakdown: {
            consistency: { mean: 0, stdDev: 0, cv: 0, points: 0, maxPoints: 30 },
            budget: { monthlyBudget: 0, actualCost: 0, budgetUsedPct: 0, monthProgress: 0, pacingRatio: 0, points: 0, maxPoints: 40 },
            trend: { thisWeek: 0, lastWeek: 0, changePct: 0, points: 0, maxPoints: 30 },
        },
        tips: [],
    };

    // ===== A. CONSISTENCY SCORE (30 pts) =====
    const last30Days = dailyUsage.slice(-30);
    const usageValues = last30Days.filter(d => d.usage > 0).map(d => d.usage);

    if (usageValues.length >= 7) {
        const mean = usageValues.reduce((a, b) => a + b, 0) / usageValues.length;
        const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / usageValues.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

        let consistencyPts = 6;
        if (cv < 15) consistencyPts = 30;
        else if (cv < 25) consistencyPts = 24;
        else if (cv < 40) consistencyPts = 18;
        else if (cv < 60) consistencyPts = 12;

        result.consistencyScore = consistencyPts;
        result.breakdown.consistency = {
            mean: parseFloat(mean.toFixed(2)),
            stdDev: parseFloat(stdDev.toFixed(2)),
            cv: parseFloat(cv.toFixed(1)),
            points: consistencyPts,
            maxPoints: 30,
        };

        if (consistencyPts < 18) {
            result.tips.push('consistency');
        }
    }

    // ===== B. BUDGET COMPLIANCE SCORE (40 pts) =====
    const budget = settings.monthlyBudget || 500000;
    const tariff = settings.tariffPerKwh || 1444.70;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)));
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgress = daysElapsed / daysInMonth;

    const currentMonthStr = format(now, 'yyyy-MM');
    const thisMonthUsage = last30Days
        .filter(d => d.date && d.date.startsWith(currentMonthStr))
        .reduce((sum, d) => sum + d.usage, 0);

    const actualCost = thisMonthUsage * tariff;
    const budgetUsedPct = budget > 0 ? (actualCost / budget) : 0;
    const pacingRatio = monthProgress > 0 ? budgetUsedPct / monthProgress : 0;

    let budgetPts = 8;
    if (pacingRatio < 0.8) budgetPts = 40;
    else if (pacingRatio < 1.0) budgetPts = 32;
    else if (pacingRatio < 1.2) budgetPts = 24;
    else if (pacingRatio < 1.5) budgetPts = 16;

    result.budgetScore = budgetPts;
    result.breakdown.budget = {
        monthlyBudget: budget,
        actualCost: parseFloat(actualCost.toFixed(0)),
        budgetUsedPct: parseFloat((budgetUsedPct * 100).toFixed(1)),
        monthProgress: parseFloat((monthProgress * 100).toFixed(1)),
        pacingRatio: parseFloat(pacingRatio.toFixed(2)),
        points: budgetPts,
        maxPoints: 40,
    };

    if (budgetPts < 24) {
        result.tips.push('budget');
    }

    // ===== C. TREND SCORE (30 pts) =====
    const sortedDaily = [...dailyUsage].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const thisWeek = sortedDaily.slice(0, 7).reduce((s, d) => s + d.usage, 0);
    const lastWeek = sortedDaily.slice(7, 14).reduce((s, d) => s + d.usage, 0);

    let trendPts = 20;
    let changePct = 0;

    if (lastWeek > 0) {
        changePct = ((thisWeek - lastWeek) / lastWeek) * 100;

        if (changePct < -10) trendPts = 30;
        else if (changePct < -5) trendPts = 25;
        else if (changePct <= 5) trendPts = 20;
        else if (changePct < 10) trendPts = 12;
        else trendPts = 6;
    }

    result.trendScore = trendPts;
    result.breakdown.trend = {
        thisWeek: parseFloat(thisWeek.toFixed(2)),
        lastWeek: parseFloat(lastWeek.toFixed(2)),
        changePct: parseFloat(changePct.toFixed(1)),
        points: trendPts,
        maxPoints: 30,
    };

    if (trendPts < 20) {
        result.tips.push('trend');
    }

    // ===== TOTAL SCORE & GRADE =====
    result.totalScore = result.consistencyScore + result.budgetScore + result.trendScore;

    if (result.totalScore >= 90) result.grade = 'A+';
    else if (result.totalScore >= 80) result.grade = 'A';
    else if (result.totalScore >= 70) result.grade = 'B';
    else if (result.totalScore >= 60) result.grade = 'C';
    else if (result.totalScore >= 50) result.grade = 'D';
    else result.grade = 'F';

    return result;
}

