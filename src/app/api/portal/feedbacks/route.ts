import { NextRequest, NextResponse } from 'next/server';
import { createPortalFeedback, getPortalFeedbacks, updatePortalFeedback } from '@/lib/portalAuth';

export const runtime = 'nodejs';

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '反馈操作失败';
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') || '';
    const result = await getPortalFeedbacks(token);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createPortalFeedback(body.token || '', body.feedback || body);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await updatePortalFeedback(body.token || '', body.feedbackId || '', body.updates || body);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
