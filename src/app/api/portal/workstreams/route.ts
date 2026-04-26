import { NextResponse } from 'next/server';
import { createPortalWorkstream, deletePortalWorkstream, updatePortalWorkstream } from '@/lib/portalAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const input = body?.workstream && typeof body.workstream === 'object' ? body.workstream : {};
    const payload = await createPortalWorkstream(token, input);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || '新增大条线失败' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const workstreamId = typeof body?.workstreamId === 'string' ? body.workstreamId : '';
    const input = body?.workstream && typeof body.workstream === 'object' ? body.workstream : {};
    const payload = await updatePortalWorkstream(token, workstreamId, input);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || '调整大条线失败' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const workstreamId = typeof body?.workstreamId === 'string' ? body.workstreamId : '';
    const payload = await deletePortalWorkstream(token, workstreamId);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || '删除大条线失败' }, { status: 400 });
  }
}
