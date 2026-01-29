'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CoinList from '@/components/CoinList';
import SellStrategyForm from '@/components/SellStrategyForm';
import AISignalDisplay from '@/components/AISignalDisplay';
import Navigation from '@/components/Navigation';
import { Coin, SellStrategy, AISignal } from '@/types';
import { useUpbitWebSocket } from '@/hooks/useUpbitWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { createMyStrategy } from '@/lib/strategy-store';

export default function NewStrategyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const coins = useUpbitWebSocket();
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [aiSignal, setAiSignal] = useState<AISignal | null>(null);
  const [saving, setSaving] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // URL 쿼리 파라미터에서 코인 선택 (coin 파라미터가 변경될 때만 실행)
  const coinSymbolFromUrl = searchParams.get('coin');
  const prevCoinSymbolRef = useRef<string | null>(null);
  
  useEffect(() => {
    // coin 파라미터가 변경되었을 때만 실행
    if (coinSymbolFromUrl && coinSymbolFromUrl !== prevCoinSymbolRef.current && coins.length > 0) {
      const coin = coins.find((c) => c.symbol === coinSymbolFromUrl);
      if (coin) {
        prevCoinSymbolRef.current = coinSymbolFromUrl;
        setSelectedCoin(coin);
        fetchAISignal(coin);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinSymbolFromUrl]); // coinSymbolFromUrl이 변경될 때만 실행

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const handleCoinSelect = (coin: Coin) => {
    setSelectedCoin(coin);
    fetchAISignal(coin);
  };

  const fetchAISignal = async (coin: Coin) => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const response = await fetch('/api/ai-signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coinSymbol: coin.symbol,
          currentPrice: coin.price,
        }),
        signal: abortController.signal,
      });

      if (response.ok && isMountedRef.current) {
        const signal = await response.json();
        setAiSignal(signal);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 요청이 취소된 경우는 무시
        return;
      }
      if (isMountedRef.current) {
        console.error('AI 신호 조회 실패:', error);
      }
    }
  };

  const handleSaveStrategy = async (strategy: Omit<SellStrategy, 'id' | 'createdAt'>) => {
    setSaving(true);
    const saved = await createMyStrategy(strategy);
    setSaving(false);

    if (!saved) {
      alert('전략 저장에 실패했습니다. Supabase 테이블/RLS 설정을 확인해주세요.');
      return;
    }

    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // 리다이렉트 중
  }

  return (
    <>
      <Navigation />
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            새 전략 생성
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--secondary)' }}>
            코인을 선택하고 매도 전략을 설정하세요
          </p>
        </header>

        {!selectedCoin ? (
          <CoinList coins={coins} onSelectCoin={handleCoinSelect} />
        ) : (
          <>
            {aiSignal && <AISignalDisplay signal={aiSignal} />}
            <SellStrategyForm
              coin={selectedCoin}
              onSave={handleSaveStrategy}
              onCancel={() => {
                setSelectedCoin(null);
                setAiSignal(null);
                router.push('/strategy/new');
              }}
            />
            {saving && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--secondary)' }}>
                전략 저장 중...
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

