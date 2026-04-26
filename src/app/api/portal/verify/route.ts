import { NextResponse } from 'next/server';
import { verifyPortalToken } from '@/lib/portalAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const payload = await verifyPortalToken(token);
    return NextResponse.json({ ok: true, readonly: !payload.canEdit, ...payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || '访问链接无效' }, { status: 401 });
  }
}
