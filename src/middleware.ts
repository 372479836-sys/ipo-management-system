import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATH_PREFIXES = [
  '/portal',
  '/api/portal',
  '/_next',
  '/favicon.ico',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="IPO Management System", charset="UTF-8"',
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const adminUser = process.env.ADMIN_BASIC_USER;
  const adminPassword = process.env.ADMIN_BASIC_PASSWORD;

  // 本地/预览/生产如未配置密码时不拦截，避免影响当前项目查看；
  // 如需强制保护生产后台，请先在 Vercel 配好 ADMIN_BASIC_USER / ADMIN_BASIC_PASSWORD 再启用 fail-closed。
  if (!adminUser || !adminPassword) {
    return NextResponse.next();
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Basic ')) {
    return unauthorized();
  }

  try {
    const encoded = authorization.slice('Basic '.length);
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(':');
    const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded;
    const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';

    if (username === adminUser && password === adminPassword) {
      return NextResponse.next();
    }
  } catch {
    // fall through to 401
  }

  return unauthorized();
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
};
