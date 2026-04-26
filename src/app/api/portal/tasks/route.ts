import { NextResponse } from 'next/server';
import { createPortalTask, updatePortalTask } from '@/lib/portalAuth';

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


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const input = body?.task && typeof body.task === 'object' ? body.task : {};
    const payload = await createPortalTask(token, input);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || '新增事项失败' }, { status: 400 });
  }
}
