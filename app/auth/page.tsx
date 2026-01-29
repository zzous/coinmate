'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const hasRedirectedRef = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 로딩 타임아웃 설정 (3초 후 강제로 로그인 폼 표시)
  useEffect(() => {
    if (loading && !forceShowForm) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('로딩 타임아웃 - 강제로 로그인 폼 표시');
        setForceShowForm(true);
      }, 3000);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, forceShowForm]);

  useEffect(() => {
    // 디버깅: 상태 확인
    console.log('[AuthPage] 상태:', { loading, hasUser: !!user, hasRedirected: hasRedirectedRef.current, isRedirecting });
    
    // 이미 로그인한 경우에만 한 번만 리다이렉트
    if (!loading && user && !hasRedirectedRef.current && !isRedirecting) {
      hasRedirectedRef.current = true;
      setIsRedirecting(true);
      const next = searchParams.get('next') || '/';
      
      console.log('[AuthPage] 리다이렉트 시작:', next, 'user:', user?.email);
      
      // window.location.replace를 사용하여 히스토리에 남기지 않고 리다이렉트
      // 이렇게 하면 뒤로가기 시 /auth로 돌아오지 않음
      const targetUrl = next.startsWith('http') ? next : window.location.origin + next;
      console.log('[AuthPage] 리다이렉트 대상 URL:', targetUrl);
      
      // 약간의 딜레이를 주어 상태 업데이트가 완료되도록 함
      setTimeout(() => {
        window.location.replace(targetUrl);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isRedirecting]); // router, searchParams 제외

  // 로딩 중이지만 타임아웃되면 로그인 폼 표시
  if (loading && !isRedirecting && !forceShowForm) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>로딩 중...</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginTop: '1rem' }}>
            로딩이 오래 걸리면 새로고침해주세요.
          </div>
        </div>
      </div>
    );
  }

  // 로그인한 경우 리다이렉트 중
  if (user && isRedirecting) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>리다이렉트 중...</div>
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              style={{ 
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              직접 홈으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 무조건 로그인 폼 표시
  return (
    <div className="container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--foreground)' }}>
          coinmate
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--secondary)' }}>
          AI 기반 코인 매도 신호 분석 및 자동화 시스템
        </p>
      </header>
      <AuthForm />
    </div>
  );
}

