import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SystemSettingsSchema } from '@/lib/schemas';
import logger from '@/lib/logger';

// GET /api/settings - Get system settings
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
        }

        let settings = await prisma.systemSettings.findFirst();

        // Create default settings if not exists
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    capacityMarginEnabled: false,
                    capacityMarginPercent: 0,
                    slotDuration: 60,
                    dayStart: '09:30',
                    dayEnd: '17:00',
                    lunchBreakStart: '12:00',
                    lunchBreakEnd: '13:00',
                },
            });
        }

        return NextResponse.json({
            id: settings.id,
            capacity_margin_enabled: settings.capacityMarginEnabled,
            capacity_margin_percent: settings.capacityMarginPercent,
            slot_duration: settings.slotDuration,
            day_start: settings.dayStart,
            day_end: settings.dayEnd,
            lunch_break_start: settings.lunchBreakStart,
            lunch_break_end: settings.lunchBreakEnd,
        });
    } catch (error) {
        logger.error('Get settings error:', { error });
        return NextResponse.json(
            { detail: 'Ayarlar alınırken bir hata oluştu' },
            { status: 500 }
        );
    }
}

// PUT /api/settings - Update system settings
export async function PUT(request: Request) {
    try {
        const user = await getCurrentUser(request);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await request.json();
        const validation = SystemSettingsSchema.partial().safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { detail: 'Geçersiz veri', errors: validation.error.issues },
                { status: 400 }
            );
        }

        const {
            capacity_margin_enabled,
            capacity_margin_percent,
            slot_duration,
            day_start,
            day_end,
            lunch_break_start,
            lunch_break_end,
        } = validation.data;

        // Find existing settings or create new
        let settings = await prisma.systemSettings.findFirst();

        const updateData: Record<string, unknown> = {};
        if (capacity_margin_enabled !== undefined) updateData.capacityMarginEnabled = capacity_margin_enabled;
        if (capacity_margin_percent !== undefined) updateData.capacityMarginPercent = capacity_margin_percent;
        if (slot_duration !== undefined) updateData.slotDuration = slot_duration;
        if (day_start !== undefined) updateData.dayStart = day_start;
        if (day_end !== undefined) updateData.dayEnd = day_end;
        if (lunch_break_start !== undefined) updateData.lunchBreakStart = lunch_break_start;
        if (lunch_break_end !== undefined) updateData.lunchBreakEnd = lunch_break_end;

        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: updateData,
            });
        } else {
            settings = await prisma.systemSettings.create({
                data: {
                    capacityMarginEnabled: capacity_margin_enabled ?? false,
                    capacityMarginPercent: capacity_margin_percent ?? 0,
                    slotDuration: slot_duration ?? 60,
                    dayStart: day_start ?? '09:30',
                    dayEnd: day_end ?? '17:00',
                    lunchBreakStart: lunch_break_start ?? '12:00',
                    lunchBreakEnd: lunch_break_end ?? '13:00',
                },
            });
        }

        logger.info('Settings updated:', { settings });

        return NextResponse.json({
            id: settings.id,
            capacity_margin_enabled: settings.capacityMarginEnabled,
            capacity_margin_percent: settings.capacityMarginPercent,
            slot_duration: settings.slotDuration,
            day_start: settings.dayStart,
            day_end: settings.dayEnd,
            lunch_break_start: settings.lunchBreakStart,
            lunch_break_end: settings.lunchBreakEnd,
        });
    } catch (error) {
        logger.error('Update settings error:', { error });
        return NextResponse.json(
            { detail: 'Ayarlar güncellenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

