'use client';

import { SellStrategy } from '@/types';

interface StrategyListProps {
  strategies: SellStrategy[];
  onToggleActive: (strategyId: string, isActive: boolean) => void;
  onDelete: (strategyId: string) => void;
}

export default function StrategyList({ strategies, onToggleActive, onDelete }: StrategyListProps) {
  if (strategies.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: 'var(--secondary)' }}>
          등록된 매도 전략이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
        📋 활성 매도 전략
      </h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            style={{
              padding: '1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              background: strategy.isActive ? 'var(--background)' : 'transparent',
              opacity: strategy.isActive ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  {strategy.coinSymbol}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
                  {strategy.strategyType === 'profit-target' && '이익 실현'}
                  {strategy.strategyType === 'stop-loss' && '손절매'}
                  {strategy.strategyType === 'ai-signal' && 'AI 신호 기반'}
                  {strategy.strategyType === 'time-based' && '시간 기반'}
                </div>
              </div>
              <div
                className="badge"
                style={{
                  background: strategy.isActive ? 'var(--success)20' : 'var(--secondary)20',
                  color: strategy.isActive ? 'var(--success)' : 'var(--secondary)',
                }}
              >
                {strategy.isActive ? '활성' : '비활성'}
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              {strategy.targetPrice && (
                <div>목표 가격: ${strategy.targetPrice.toLocaleString()}</div>
              )}
              {strategy.stopLossPrice && (
                <div>손절 가격: ${strategy.stopLossPrice.toLocaleString()}</div>
              )}
              {strategy.profitPercentage && (
                <div>이익률: {strategy.profitPercentage}%</div>
              )}
              {strategy.lossPercentage && (
                <div>손실률: {strategy.lossPercentage}%</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => onToggleActive(strategy.id!, !strategy.isActive)}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                {strategy.isActive ? '비활성화' : '활성화'}
              </button>
              <button
                onClick={() => onDelete(strategy.id!)}
                className="btn btn-danger"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

