import { NextResponse } from 'next/server';
import { updatePortalGanttCell } from '@/lib/portalAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const cellId = typeof body?.cellId === 'string' ? body.cellId : '';
    const updates = body?.updates && typeof body.updates === 'object' ? body.updates : {};
    const payload = await updatePortalGanttCell(token, cellId, updates);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || '甘特节点更新失败' }, { status: 400 });
  }
}
