import { NextResponse } from 'next/server';
import { updatePortalTask } from '@/lib/portalAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const taskId = typeof body?.taskId === 'string' ? body.taskId : '';
    const updates = body?.updates && typeof body.updates === 'object' ? body.updates : {};
    const payload = await updatePortalTask(token, taskId, updates);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || '更新失败' }, { status: 400 });
  }
}
