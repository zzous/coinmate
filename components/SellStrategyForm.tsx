'use client';

import { useState } from 'react';
import { SellStrategy, Coin } from '@/types';

interface SellStrategyFormProps {
  coin: Coin | null;
  onSave: (strategy: Omit<SellStrategy, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function SellStrategyForm({ coin, onSave, onCancel }: SellStrategyFormProps) {
  const [strategyType, setStrategyType] = useState<SellStrategy['strategyType']>('profit-target');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [profitPercentage, setProfitPercentage] = useState('');
  const [lossPercentage, setLossPercentage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!coin) return;

    const strategy: Omit<SellStrategy, 'id' | 'createdAt'> = {
      coinSymbol: coin.symbol,
      strategyType,
      isActive: true,
    };

    if (strategyType === 'profit-target') {
      if (targetPrice) strategy.targetPrice = parseFloat(targetPrice);
      if (profitPercentage) strategy.profitPercentage = parseFloat(profitPercentage);
    } else if (strategyType === 'stop-loss') {
      if (stopLossPrice) strategy.stopLossPrice = parseFloat(stopLossPrice);
      if (lossPercentage) strategy.lossPercentage = parseFloat(lossPercentage);
    }

    onSave(strategy);
  };

  if (!coin) return null;

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
        ⚙️ 매도 전략 설정 - {coin.name} ({coin.symbol})
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            전략 타입
          </label>
          <select
            className="select"
            value={strategyType}
            onChange={(e) => setStrategyType(e.target.value as SellStrategy['strategyType'])}
          >
            <option value="profit-target">이익 실현 (Profit Target)</option>
            <option value="stop-loss">손절매 (Stop Loss)</option>
            <option value="ai-signal">AI 신호 기반</option>
            <option value="time-based">시간 기반</option>
          </select>
        </div>

        {strategyType === 'profit-target' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                목표 가격 (KRW)
              </label>
              <input
                type="number"
                className="input"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={`현재가: ${coin.price.toLocaleString()}원`}
                step="0.01"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                이익률 (%)
              </label>
              <input
                type="number"
                className="input"
                value={profitPercentage}
                onChange={(e) => setProfitPercentage(e.target.value)}
                placeholder="예: 10 (10% 상승 시 매도)"
                step="0.1"
              />
            </div>
          </>
        )}

        {strategyType === 'stop-loss' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                손절 가격 (KRW)
              </label>
              <input
                type="number"
                className="input"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                placeholder={`현재가: ${coin.price.toLocaleString()}원`}
                step="0.01"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                손실률 (%)
              </label>
              <input
                type="number"
                className="input"
                value={lossPercentage}
                onChange={(e) => setLossPercentage(e.target.value)}
                placeholder="예: 5 (5% 하락 시 매도)"
                step="0.1"
              />
            </div>
          </>
        )}

        {strategyType === 'ai-signal' && (
          <div style={{ 
            padding: '1rem', 
            background: 'var(--background)', 
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            marginBottom: '1rem'
          }}>
            <p style={{ color: 'var(--secondary)' }}>
              AI가 시장 데이터를 분석하여 매도 신호를 생성합니다. 추가 설정이 필요하지 않습니다.
            </p>
          </div>
        )}

        {strategyType === 'time-based' && (
          <div style={{ 
            padding: '1rem', 
            background: 'var(--background)', 
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            marginBottom: '1rem'
          }}>
            <p style={{ color: 'var(--secondary)' }}>
              특정 시간에 자동으로 매도합니다. (추후 구현 예정)
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            취소
          </button>
          <button type="submit" className="btn btn-primary">
            전략 저장
          </button>
        </div>
      </form>
    </div>
  );
}

