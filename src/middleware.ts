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

  // 生产环境必须 fail-closed：如果 Vercel 漏配后台账号密码，不能放行内部管理页。
  // 本地开发保留免认证，避免影响调试和构建。
  if (!adminUser || !adminPassword) {
    if (process.env.NODE_ENV === 'production') {
      return unauthorized();
    }
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
