'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import TradeHistoryList from '@/components/TradeHistoryList';
import { useAuth } from '@/hooks/useAuth';
import { useUpbitWebSocket } from '@/hooks/useUpbitWebSocket';
import { createMyTrade, listMyTrades } from '@/lib/trade-history-store';
import type { TradeHistory } from '@/types';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const coins = useUpbitWebSocket();
  const symbols = useMemo(() => coins.map((c) => c.symbol), [coins]);

  const [trades, setTrades] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const [coinSymbol, setCoinSymbol] = useState('');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user) {
      (async () => {
        setLoading(true);
        const data = await listMyTrades(100);
        setTrades(data);
        setLoading(false);
      })();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!coinSymbol && symbols.length > 0) {
      setCoinSymbol(symbols[0]);
    }
  }, [coinSymbol, symbols]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinSymbol) return;

    const p = Number(price);
    const a = Number(amount);
    if (!Number.isFinite(p) || p <= 0) return alert('가격을 올바르게 입력하세요.');
    if (!Number.isFinite(a) || a <= 0) return alert('수량을 올바르게 입력하세요.');

    setSaving(true);
    const saved = await createMyTrade({
      coinSymbol,
      action,
      price: p,
      amount: a,
    });
    setSaving(false);

    if (!saved) {
      alert('거래 히스토리 저장 실패. Supabase 테이블/RLS 설정을 확인해주세요.');
      return;
    }

    setTrades((prev) => [saved, ...prev]);
    setPrice('');
    setAmount('');
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

  if (!user) return null;

  return (
    <>
      <Navigation />
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            거래 히스토리
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--secondary)' }}>
            자동매도 전 단계로, 지금은 수동으로 거래 기록을 추가해볼 수 있어요.
          </p>
        </header>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            ➕ 거래 기록 추가
          </h2>
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                  코인
                </label>
                <select className="select" value={coinSymbol} onChange={(e) => setCoinSymbol(e.target.value)}>
                  {symbols.length === 0 ? (
                    <option value="">로딩 중...</option>
                  ) : (
                    symbols.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                  액션
                </label>
                <select className="select" value={action} onChange={(e) => setAction(e.target.value as 'buy' | 'sell')}>
                  <option value="buy">매수</option>
                  <option value="sell">매도</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                  가격(KRW)
                </label>
                <input className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="예: 50000" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                  수량
                </label>
                <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="예: 0.1" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--secondary)' }}>
            불러오는 중...
          </div>
        ) : (
          <TradeHistoryList trades={trades} />
        )}
      </div>
    </>
  );
}


