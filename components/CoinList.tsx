'use client';

import { Coin } from '@/types';

interface CoinListProps {
  coins: Coin[];
  onSelectCoin: (coin: Coin) => void;
}

export default function CoinList({ coins, onSelectCoin }: CoinListProps) {
  return (
    <div className="card">
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
        📊 코인 목록
      </h2>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {coins.map((coin) => (
          <div
            key={coin.symbol}
            onClick={() => onSelectCoin(coin)}
            style={{
              padding: '1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.background = 'var(--background)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div>
              <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                {coin.name} ({coin.symbol})
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                거래량: {coin.volume24h.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                ${coin.price.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: coin.change24h >= 0 ? 'var(--profit)' : 'var(--loss)',
                  marginTop: '0.25rem',
                }}
              >
                {coin.change24h >= 0 ? '+' : ''}
                {coin.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

