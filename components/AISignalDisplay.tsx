'use client';

import { AISignal } from '@/types';

interface AISignalDisplayProps {
  signal: AISignal;
}

export default function AISignalDisplay({ signal }: AISignalDisplayProps) {
  const getSignalColor = () => {
    switch (signal.signal) {
      case 'sell':
        return 'var(--danger)';
      case 'buy':
        return 'var(--success)';
      case 'hold':
        return 'var(--warning)';
      default:
        return 'var(--secondary)';
    }
  };

  const getSignalLabel = () => {
    switch (signal.signal) {
      case 'sell':
        return '매도';
      case 'buy':
        return '매수';
      case 'hold':
        return '보유';
      default:
        return signal.signal;
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
          🤖 AI 매도 신호 - {signal.coinSymbol}
        </h2>
        <div
          className="badge"
          style={{
            background: `${getSignalColor()}20`,
            color: getSignalColor(),
            fontSize: '1rem',
            padding: '0.5rem 1rem',
          }}
        >
          {getSignalLabel()}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--secondary)' }}>신뢰도</span>
          <span style={{ fontWeight: '600' }}>{(signal.confidence * 100).toFixed(1)}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--border)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${signal.confidence * 100}%`,
              height: '100%',
              background: getSignalColor(),
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          분석 근거
        </h3>
        <div
          style={{
            padding: '1rem',
            background: 'var(--background)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
          }}
        >
          {signal.reasoning}
        </div>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
        생성 시간: {new Date(signal.timestamp).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}

