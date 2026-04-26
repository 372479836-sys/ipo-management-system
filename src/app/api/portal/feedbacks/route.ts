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
    const token = typeof body?.token === 'string' ? body.token : '';
    const feedback = body?.feedback && typeof body.feedback === 'object' ? body.feedback : null;
    if (!feedback) {
      throw new Error('缺少反馈内容');
    }
    const result = await createPortalFeedback(token, feedback);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const feedbackId = typeof body?.feedbackId === 'string' ? body.feedbackId : '';
    const updates = body?.updates && typeof body.updates === 'object' ? body.updates : null;
    if (!updates) {
      throw new Error('缺少反馈更新内容');
    }
    const result = await updatePortalFeedback(token, feedbackId, updates);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
