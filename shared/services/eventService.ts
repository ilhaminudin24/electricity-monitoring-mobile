/**
 * Event Service
 * Event Sourcing operations for electricity readings
 * Implements dual-write strategy: writes to both token_events and electricity_readings
 */

import { supabase } from '@/lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

export const EVENT_TYPES = {
    TOPUP: 'TOPUP',
    METER_READING: 'METER_READING',
    ADJUSTMENT: 'ADJUSTMENT',
    VOID: 'VOID',
} as const;

export const TRIGGER_TYPES = {
    BACKDATE_TOPUP: 'BACKDATE_TOPUP',
    EDIT_TOPUP: 'EDIT_TOPUP',
    DELETE_TOPUP: 'DELETE_TOPUP',
    MANUAL_CORRECTION: 'MANUAL_CORRECTION',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
export type TriggerType = (typeof TRIGGER_TYPES)[keyof typeof TRIGGER_TYPES];

export interface TokenEvent {
    id: string;
    user_id: string;
    event_type: EventType;
    event_date: string;
    kwh_amount: number;
    token_cost: number | null;
    notes: string | null;
    meter_photo_url: string | null;
    is_voided: boolean;
    created_at: string;
}

export interface EventWithPosition extends TokenEvent {
    calculated_position: number;
    daily_consumption: number;
    is_topup: boolean;
}

export interface RecalculationBatch {
    id: string;
    user_id: string;
    trigger_type: TriggerType;
    trigger_event_id: string | null;
    affected_events: AffectedEventSnapshot[];
    events_count: number;
    can_rollback_until: string;
    rolled_back_at: string | null;
    rollback_reason: string | null;
    created_at: string;
}

export interface AffectedEventSnapshot {
    event_id: string;
    old_kwh: number;
    new_kwh: number;
    event_date: string;
    event_type: EventType;
}

export interface ValidationIssue {
    type: 'NEGATIVE_POSITION' | 'NEGATIVE_CONSUMPTION' | 'VALIDATION_ERROR';
    severity: 'BLOCK' | 'WARNING';
    message: string;
    eventId?: string;
}

export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
}

export interface BackdatePreview {
    id: string;
    event_date: string;
    event_type: EventType;
    is_topup: boolean;
    current_kwh: number;
    new_kwh: number;
    offset: number;
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Add a new event (TOPUP or METER_READING)
 */
export const addEvent = async (
    userId: string,
    eventData: {
        eventType: EventType;
        eventDate: string;
        kwhAmount: number;
        tokenCost?: number;
        notes?: string;
        meterPhotoUrl?: string;
    }
): Promise<{ event: TokenEvent; isBackdate: boolean; affectedCount: number }> => {
    const {
        eventType,
        eventDate,
        kwhAmount,
        tokenCost = null,
        notes = null,
        meterPhotoUrl = null,
    } = eventData;

    // Check if this is a backdate
    const backdateCheck = await checkForBackdate(userId, eventDate);

    // Insert the event
    const { data: event, error } = await supabase
        .from('token_events')
        .insert({
            user_id: userId,
            event_type: eventType,
            event_date: eventDate,
            kwh_amount: kwhAmount,
            token_cost: tokenCost,
            notes: notes,
            meter_photo_url: meterPhotoUrl,
            created_by: userId,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        event,
        isBackdate: backdateCheck.isBackdate,
        affectedCount: backdateCheck.affectedEvents.length,
    };
};

/**
 * Check if adding an event at the given date would be a backdate
 */
export const checkForBackdate = async (
    userId: string,
    eventDate: string
): Promise<{ isBackdate: boolean; affectedEvents: TokenEvent[] }> => {
    const { data: eventsAfter, error } = await supabase
        .from('token_events')
        .select('*')
        .eq('user_id', userId)
        .eq('is_voided', false)
        .gt('event_date', eventDate)
        .order('event_date', { ascending: true });

    if (error) {
        console.error('Error checking backdate:', error);
        return { isBackdate: false, affectedEvents: [] };
    }

    return {
        isBackdate: eventsAfter && eventsAfter.length > 0,
        affectedEvents: eventsAfter || [],
    };
};

/**
 * Get all events with calculated positions using database function
 */
export const getEventsWithPositions = async (
    userId: string
): Promise<EventWithPosition[]> => {
    const { data, error } = await supabase.rpc('calculate_user_positions', {
        p_user_id: userId,
    });

    if (error) throw error;

    return (data || []).map((e: any) => ({
        ...e,
        is_topup: e.event_type === EVENT_TYPES.TOPUP,
    }));
};

/**
 * Validate if backdate would result in illogical data
 */
export const validateBackdateOperation = async (
    userId: string,
    backdateDate: string,
    topupKwh: number
): Promise<ValidationResult> => {
    const issues: ValidationIssue[] = [];

    try {
        const positions = await getEventsWithPositions(userId);
        const eventsAfter = positions.filter(
            (e) => new Date(e.event_date) > new Date(backdateDate)
        );

        if (eventsAfter.length === 0) {
            return { valid: true, issues: [] };
        }

        // Check: Would any position become negative?
        for (const event of eventsAfter) {
            const newPosition = (event.calculated_position || 0) + topupKwh;
            if (newPosition < 0) {
                issues.push({
                    type: 'NEGATIVE_POSITION',
                    severity: 'BLOCK',
                    message: `Posisi meter pada ${formatDate(event.event_date)} akan menjadi negatif (${newPosition.toFixed(2)} kWh)`,
                    eventId: event.id,
                });
            }
        }

        return {
            valid: issues.filter((i) => i.severity === 'BLOCK').length === 0,
            issues,
        };
    } catch (error: any) {
        return {
            valid: false,
            issues: [
                {
                    type: 'VALIDATION_ERROR',
                    severity: 'BLOCK',
                    message: 'Gagal melakukan validasi: ' + error.message,
                },
            ],
        };
    }
};

/**
 * Preview how positions would change after backdate
 */
export const previewBackdateImpact = async (
    userId: string,
    backdateDate: string,
    topupKwh: number
): Promise<BackdatePreview[]> => {
    const eventsAfter = await getEventsAfterDate(userId, backdateDate);

    return eventsAfter.map((event) => ({
        id: event.id,
        event_date: event.event_date,
        event_type: event.event_type,
        is_topup: event.is_topup,
        current_kwh: event.calculated_position,
        new_kwh: (event.calculated_position || 0) + topupKwh,
        offset: topupKwh,
    }));
};

/**
 * Get events after a specific date with positions
 */
export const getEventsAfterDate = async (
    userId: string,
    afterDate: string
): Promise<EventWithPosition[]> => {
    const { data: events, error } = await supabase
        .from('token_events')
        .select('*')
        .eq('user_id', userId)
        .eq('is_voided', false)
        .gt('event_date', afterDate)
        .order('event_date', { ascending: true });

    if (error) throw error;

    const positions = await getEventsWithPositions(userId);
    const positionMap = new Map(positions.map((p) => [p.id, p]));

    return (events || []).map((event: TokenEvent) => ({
        ...event,
        calculated_position: positionMap.get(event.id)?.calculated_position || 0,
        daily_consumption: positionMap.get(event.id)?.daily_consumption || 0,
        is_topup: event.event_type === EVENT_TYPES.TOPUP,
    }));
};

/**
 * Perform cascading recalculation and create audit batch
 */
export const performCascadingRecalculation = async (
    userId: string,
    triggerEventId: string,
    triggerType: TriggerType,
    affectedEvents: EventWithPosition[] | BackdatePreview[],
    kwhOffset: number
): Promise<{ success: boolean; batch: RecalculationBatch }> => {
    // Build snapshot
    const affectedSnapshot: AffectedEventSnapshot[] = affectedEvents.map((event) => ({
        event_id: event.id,
        old_kwh: 'calculated_position' in event
            ? (event.calculated_position || event.kwh_amount)
            : event.current_kwh,
        new_kwh: 'calculated_position' in event
            ? ((event.calculated_position || event.kwh_amount) + kwhOffset)
            : event.new_kwh,
        event_date: event.event_date,
        event_type: event.event_type,
    }));

    // Create recalculation batch
    const { data: batch, error } = await supabase
        .from('recalculation_batches')
        .insert({
            user_id: userId,
            trigger_type: triggerType,
            trigger_event_id: triggerEventId,
            affected_events: affectedSnapshot,
            events_count: affectedEvents.length,
            created_by: userId,
        })
        .select()
        .single();

    if (error) throw error;

    // Link batch to affected events
    const eventIds = affectedEvents.map((e) => e.id).filter(Boolean);
    if (eventIds.length > 0) {
        await supabase
            .from('token_events')
            .update({ recalc_batch_id: batch.id })
            .in('id', eventIds);
    }

    return { success: true, batch };
};

/**
 * Get pending rollback batches (within 24-hour window)
 */
export const getPendingRollbacks = async (
    userId: string
): Promise<RecalculationBatch[]> => {
    const { data, error } = await supabase
        .from('recalculation_batches')
        .select('*')
        .eq('user_id', userId)
        .is('rolled_back_at', null)
        .gt('can_rollback_until', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

/**
 * Rollback a recalculation batch (within 24 hours)
 */
export const rollbackRecalculation = async (
    batchId: string,
    reason: string,
    userId: string
): Promise<{ success: boolean }> => {
    // Get the batch
    const { data: batch, error: batchError } = await supabase
        .from('recalculation_batches')
        .select('*')
        .eq('id', batchId)
        .single();

    if (batchError) throw batchError;

    // Check rollback window
    if (new Date() > new Date(batch.can_rollback_until)) {
        throw new Error('Rollback window has expired (24 hours)');
    }

    // Void the trigger event
    if (batch.trigger_event_id) {
        await voidEvent(batch.trigger_event_id, `Rollback: ${reason}`, userId);
    }

    // Mark batch as rolled back
    const { error: updateError } = await supabase
        .from('recalculation_batches')
        .update({
            rolled_back_at: new Date().toISOString(),
            rollback_reason: reason,
        })
        .eq('id', batchId);

    if (updateError) throw updateError;

    return { success: true };
};

/**
 * Void an event (soft delete)
 */
export const voidEvent = async (
    eventId: string,
    reason: string,
    userId: string
): Promise<{ success: boolean }> => {
    // Get original event
    const { data: original, error: fetchError } = await supabase
        .from('token_events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (fetchError) throw fetchError;

    // Mark as voided
    const { error: voidError } = await supabase
        .from('token_events')
        .update({
            is_voided: true,
            voided_at: new Date().toISOString(),
            voided_by: userId,
            voided_reason: reason,
        })
        .eq('id', eventId);

    if (voidError) throw voidError;

    // Create VOID event for audit trail
    await supabase.from('token_events').insert({
        user_id: original.user_id,
        event_type: EVENT_TYPES.VOID,
        event_date: new Date().toISOString(),
        kwh_amount: 0,
        void_of_event: eventId,
        notes: reason,
        created_by: userId,
        metadata: {
            voided_event: {
                event_type: original.event_type,
                kwh_amount: original.kwh_amount,
                event_date: original.event_date,
            },
        },
    });

    return { success: true };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};
