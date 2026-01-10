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
                },
            });
        }

        return NextResponse.json({
            id: settings.id,
            capacity_margin_enabled: settings.capacityMarginEnabled,
            capacity_margin_percent: settings.capacityMarginPercent,
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
        const validation = SystemSettingsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { detail: 'Geçersiz veri', errors: validation.error.issues },
                { status: 400 }
            );
        }

        const { capacity_margin_enabled, capacity_margin_percent } = validation.data;

        // Find existing settings or create new
        let settings = await prisma.systemSettings.findFirst();

        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: {
                    capacityMarginEnabled: capacity_margin_enabled,
                    capacityMarginPercent: capacity_margin_percent,
                },
            });
        } else {
            settings = await prisma.systemSettings.create({
                data: {
                    capacityMarginEnabled: capacity_margin_enabled,
                    capacityMarginPercent: capacity_margin_percent,
                },
            });
        }

        logger.info('Settings updated:', { settings });

        return NextResponse.json({
            id: settings.id,
            capacity_margin_enabled: settings.capacityMarginEnabled,
            capacity_margin_percent: settings.capacityMarginPercent,
        });
    } catch (error) {
        logger.error('Update settings error:', { error });
        return NextResponse.json(
            { detail: 'Ayarlar güncellenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
