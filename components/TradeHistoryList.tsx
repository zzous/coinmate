'use client';

import type { TradeHistory } from '@/types';

export default function TradeHistoryList({ trades }: { trades: TradeHistory[] }) {
  if (trades.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: 'var(--secondary)' }}>
          아직 거래 히스토리가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
        🧾 거래 히스토리
      </h2>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {trades.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              background: 'var(--background)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                {t.coinSymbol} · {t.action === 'buy' ? '매수' : '매도'}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                {new Date(t.timestamp).toLocaleString()}
                {t.strategyId ? ` · strategy: ${t.strategyId}` : ''}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>
                가격: {Number(t.price).toLocaleString()}원
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                수량: {Number(t.amount).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


