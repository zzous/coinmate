import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase-client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    const supabase = createSupabaseClient();

    let cancelled = false;
    let sessionInitialized = false;
    let timeoutId: NodeJS.Timeout | null = null;

    // 강제 타임아웃 (3초 후 무조건 로딩 해제)
    timeoutId = setTimeout(() => {
      if (!cancelled && isMountedRef.current && !sessionInitialized) {
        console.warn('세션 확인 강제 타임아웃 - 로딩 해제');
        setLoading(false);
        // 타임아웃 시에도 세션은 확인 시도
        sessionInitialized = true;
      }
    }, 3000);

    // 현재 세션 확인
    const initSession = async () => {
      try {
        console.log('[useAuth] 세션 확인 시작');
        
        // 1단계: localStorage에서 세션 읽기
        const { data: { session: localSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (cancelled || !isMountedRef.current) {
          console.log('[useAuth] 취소됨 또는 언마운트됨');
          return;
        }

        if (sessionError) {
          console.error('[useAuth] 세션 읽기 오류:', sessionError);
          setLoading(false);
          setUser(null);
          setSession(null);
          sessionInitialized = true;
          return;
        }

        // 2단계: 서버에서 유효한 세션인지 확인 (getUser는 서버에 요청을 보냄)
        if (localSession) {
          console.log('[useAuth] 로컬 세션 발견:', localSession.user?.email, '만료 시간:', new Date(localSession.expires_at! * 1000).toLocaleString());
          
          // 세션이 만료되었는지 확인
          const now = Math.floor(Date.now() / 1000);
          if (localSession.expires_at && localSession.expires_at < now) {
            console.warn('[useAuth] 세션이 만료됨, 토큰 갱신 시도');
            // 토큰 갱신 시도
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('[useAuth] 토큰 갱신 실패:', refreshError);
              setLoading(false);
              setUser(null);
              setSession(null);
              sessionInitialized = true;
              return;
            }
            if (refreshedSession) {
              console.log('[useAuth] 토큰 갱신 성공:', refreshedSession.user?.email);
              setSession(refreshedSession);
              setUser(refreshedSession.user ?? null);
              setLoading(false);
              sessionInitialized = true;
              return;
            }
          }
          
          // 세션이 유효한지 서버에서 확인
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (cancelled || !isMountedRef.current) {
            return;
          }

          if (userError) {
            console.error('[useAuth] 사용자 확인 오류:', userError);
            // 서버에서 유효하지 않은 세션이면 로컬 세션도 무효화
            setLoading(false);
            setUser(null);
            setSession(null);
            sessionInitialized = true;
            return;
          }

          if (user && user.id === localSession.user?.id) {
            console.log('[useAuth] 세션 유효 확인 완료:', user.email);
            setSession(localSession);
            setUser(user);
            setLoading(false);
            sessionInitialized = true;
            return;
          } else {
            console.warn('[useAuth] 세션 불일치 - 로컬과 서버 사용자 ID가 다름');
            setLoading(false);
            setUser(null);
            setSession(null);
            sessionInitialized = true;
            return;
          }
        } else {
          console.log('[useAuth] 로컬 세션 없음 - 로그아웃 상태');
          setLoading(false);
          setUser(null);
          setSession(null);
          sessionInitialized = true;
        }
      } catch (error) {
        if (!cancelled && isMountedRef.current) {
          console.warn('[useAuth] 세션 확인 실패:', error);
          setLoading(false);
          setUser(null);
          setSession(null);
          sessionInitialized = true;
        }
      } finally {
        // 타임아웃 정리
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    // 인증 상태 변경 리스너 (초기 세션 확인 후에만 활성화)
    let subscription: { unsubscribe: () => void } | null = null;
    
    const setupAuthListener = () => {
      if (subscription || cancelled) return;
      
      let lastUserId: string | null = null;
      
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((event, session) => {
        // 초기 세션이 확인된 후에만 상태 업데이트
        if (!cancelled && isMountedRef.current && sessionInitialized) {
          // SIGNED_IN, SIGNED_OUT 이벤트만 처리 (TOKEN_REFRESHED, INITIAL_SESSION은 무시)
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            const currentUserId = session?.user?.id ?? null;
            
            // 같은 사용자로 이미 로그인된 상태에서 SIGNED_IN이 반복 발생하는 것을 방지
            if (event === 'SIGNED_IN' && lastUserId === currentUserId && currentUserId !== null) {
              console.log('[useAuth] 동일 사용자 SIGNED_IN 이벤트 무시:', session?.user?.email);
              return;
            }
            
            console.log('[useAuth] 인증 상태 변경:', event, session?.user?.email || '로그아웃');
            lastUserId = currentUserId;
            
            // 상태 업데이트
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          } else {
            // TOKEN_REFRESHED, INITIAL_SESSION 등은 로그만 출력하고 상태 변경하지 않음
            console.log('[useAuth] 인증 이벤트 무시:', event);
          }
        }
      });
      
      subscription = sub;
      subscriptionRef.current = sub;
    };

    // 초기 세션 확인
    initSession().then(() => {
      // 초기 세션 확인 완료 후에만 리스너 설정
      if (!cancelled && isMountedRef.current) {
        setupAuthListener();
      }
    });

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch {
          // 구독 해제 중 에러는 무시
        }
        subscription = null;
        subscriptionRef.current = null;
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  };
}

