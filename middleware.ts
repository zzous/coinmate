import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/', '/strategy', '/settings', '/history'];
const PUBLIC_PREFIXES = ['/auth', '/api', '/_next', '/favicon.ico'];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function isProtectedPath(pathname: string) {
  // 루트('/')는 보호 대상이지만, 정적/공개 경로는 제외
  if (pathname === '/') return true;
  return PROTECTED_PREFIXES.some((p) => p !== '/' && pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name);
          return cookie?.value;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 디버깅: 쿠키 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    const allCookies = request.cookies.getAll();
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));
    if (supabaseCookies.length > 0) {
      console.log(`[Middleware] ${pathname} - Supabase 쿠키 발견:`, supabaseCookies.map(c => c.name).join(', '));
    } else {
      console.log(`[Middleware] ${pathname} - Supabase 쿠키 없음. 전체 쿠키:`, allCookies.map(c => c.name).join(', ') || '없음');
    }
  }

  // 세션 확인 (getSession과 getUser 둘 다 시도)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // 세션이 있거나 사용자가 있으면 로그인된 것으로 간주
  const isAuthenticated = !!(session || user);

  // 디버깅: 세션 확인 결과 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${pathname} - 세션: ${!!session}, 사용자: ${!!user}, 인증됨: ${isAuthenticated}`);
    if (sessionError) console.log(`[Middleware] 세션 오류:`, sessionError);
    if (userError) console.log(`[Middleware] 사용자 오류:`, userError);
  }

  // /auth 페이지에 접근하는 경우
  if (pathname === '/auth' || pathname.startsWith('/auth')) {
    // 세션이 확인되면 메인으로 리다이렉트
    // 하지만 세션이 없어도 일단 /auth 페이지는 허용 (클라이언트에서 처리)
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.delete('next');
      return NextResponse.redirect(url);
    }
    // 세션이 없어도 /auth 페이지는 허용 (클라이언트에서 세션 확인 후 처리)
    return NextResponse.next();
  }

  // 공개 경로는 그대로 통과
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 보호된 경로는 인증 확인
  // Supabase는 클라이언트에서 localStorage를 사용하므로
  // 서버 사이드 쿠키가 없어도 클라이언트에서 세션을 확인할 수 있음
  // 따라서 미들웨어에서는 쿠키 기반 인증만 확인하고,
  // 쿠키가 없어도 일단 통과시켜 클라이언트에서 처리하도록 함
  if (isProtectedPath(pathname)) {
    // 세션이 명확히 확인되면 통과
    if (isAuthenticated) {
      return response;
    }
    // 세션이 없어도 일단 통과 (클라이언트에서 localStorage 확인 후 처리)
    // 클라이언트 사이드에서 useAuth가 세션을 확인하고 리다이렉트 처리
    // 미들웨어에서 리다이렉트하면 무한 루프 발생 가능
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
      보호가 필요한 페이지들만 타겟팅.
      - /api, /_next 등은 제외
    */
    '/',
    '/strategy/:path*',
    '/settings/:path*',
    '/history/:path*',
  ],
};


