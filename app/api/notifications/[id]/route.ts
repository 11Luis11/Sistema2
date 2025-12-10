// app/api/notifications/[id]/route.ts
import { sql } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter } from '@/lib/security/rate-limit';

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const allowed = apiLimiter.check(`notifications:put:${ip}`);
    if (!allowed.allowed) return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });

    const id = Number(params.id);
    await sql`UPDATE notifications SET read = true WHERE id = ${id}`;
    return NextResponse.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    console.error('[NOTIFICATIONS PUT ID Error]', err);
    return NextResponse.json({ success: false, message: 'Error marking notification' }, { status: 500 });
  }
}
