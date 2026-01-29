'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CoinList from '@/components/CoinList';
import StrategyList from '@/components/StrategyList';
import Navigation from '@/components/Navigation';
import { SellStrategy } from '@/types';
import { useUpbitWebSocket } from '@/hooks/useUpbitWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { deleteMyStrategy, listMyStrategies, setMyStrategyActive } from '@/lib/strategy-store';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const coins = useUpbitWebSocket();
  const [strategies, setStrategies] = useState<SellStrategy[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);

  // 클라이언트 사이드 리다이렉트 (미들웨어는 쿠키 기반이라 localStorage 세션을 못 읽음)
  useEffect(() => {
    // 로딩이 완료되고 사용자가 없을 때만 리다이렉트
    if (authLoading) {
      return; // 로딩 중에는 아무것도 하지 않음
    }
    
    if (!user) {
      // 로그인하지 않은 경우에만 리다이렉트
      // window.location을 사용하여 확실히 리다이렉트 (무한 루프 방지)
      const currentPath = window.location.pathname;
      if (currentPath !== '/auth') {
        console.log('[HomePage] 사용자 없음 - /auth로 리다이렉트');
        window.location.href = `/auth?next=${encodeURIComponent(currentPath)}`;
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      (async () => {
        setStrategiesLoading(true);
        const data = await listMyStrategies();
        setStrategies(data);
        setStrategiesLoading(false);
      })();
    }
  }, [authLoading, user]);

  const handleToggleActive = async (strategyId: string, isActive: boolean) => {
    // 낙관적 업데이트
    setStrategies((prev) => prev.map((s) => (s.id === strategyId ? { ...s, isActive } : s)));
    const ok = await setMyStrategyActive(strategyId, isActive);
    if (!ok) {
      // 롤백
      setStrategies((prev) => prev.map((s) => (s.id === strategyId ? { ...s, isActive: !isActive } : s)));
    }
  };

  const handleDelete = async (strategyId: string) => {
    const prev = strategies;
    setStrategies((s) => s.filter((x) => x.id !== strategyId));
    const ok = await deleteMyStrategy(strategyId);
    if (!ok) {
      setStrategies(prev);
    }
  };

  // 로딩 중이거나 사용자가 없으면 로딩 화면 표시
  // 미들웨어가 리다이렉트를 처리하므로 여기서는 null을 반환하지 않음
  if (authLoading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  // 사용자가 없으면 로딩 화면 유지 (미들웨어가 리다이렉트 처리)
  if (!user) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>인증 확인 중...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            대시보드
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--secondary)' }}>
            실시간 코인 가격과 전략을 확인하세요
          </p>
        </header>

        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Link
            href="/strategy/new"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
            }}
          >
            ➕ 새 전략 생성
          </Link>
        </div>

        <CoinList coins={coins} onSelectCoin={(coin) => router.push(`/strategy/new?coin=${coin.symbol}`)} />
        {strategiesLoading && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--secondary)' }}>
            전략 불러오는 중...
          </div>
        )}
        <StrategyList
          strategies={strategies}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}
