'use client';

import { useState, useEffect } from 'react';
import CoinList from '@/components/CoinList';
import SellStrategyForm from '@/components/SellStrategyForm';
import AISignalDisplay from '@/components/AISignalDisplay';
import StrategyList from '@/components/StrategyList';
import { Coin, SellStrategy, AISignal } from '@/types';

export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [showStrategyForm, setShowStrategyForm] = useState(false);
  const [strategies, setStrategies] = useState<SellStrategy[]>([]);
  const [aiSignal, setAiSignal] = useState<AISignal | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoins();
    // 주기적으로 코인 가격 업데이트 (실제로는 WebSocket 사용 권장)
    const interval = setInterval(fetchCoins, 30000); // 30초마다
    return () => clearInterval(interval);
  }, []);

  const fetchCoins = async () => {
    try {
      const response = await fetch('/api/coins');
      if (response.ok) {
        const data = await response.json();
        setCoins(data);
      }
    } catch (error) {
      console.error('코인 데이터 조회 실패:', error);
    }
  };

  const handleCoinSelect = (coin: Coin) => {
    setSelectedCoin(coin);
    setShowStrategyForm(true);
    fetchAISignal(coin);
  };

  const fetchAISignal = async (coin: Coin) => {
    setLoading(true);
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
      });

      if (response.ok) {
        const signal = await response.json();
        setAiSignal(signal);
      }
    } catch (error) {
      console.error('AI 신호 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStrategy = (strategy: Omit<SellStrategy, 'id' | 'createdAt'>) => {
    const newStrategy: SellStrategy = {
      ...strategy,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setStrategies([...strategies, newStrategy]);
    setShowStrategyForm(false);
    setSelectedCoin(null);
  };

  const handleToggleActive = (strategyId: string, isActive: boolean) => {
    setStrategies(
      strategies.map((s) => (s.id === strategyId ? { ...s, isActive } : s))
    );
  };

  const handleDelete = (strategyId: string) => {
    setStrategies(strategies.filter((s) => s.id !== strategyId));
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
          🤖 CoinMate
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--secondary)' }}>
          AI 기반 코인 매도 신호 분석 및 자동화 시스템
        </p>
      </header>

      {!showStrategyForm ? (
        <>
          <CoinList coins={coins} onSelectCoin={handleCoinSelect} />
          <StrategyList
            strategies={strategies}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <>
          {selectedCoin && (
            <>
              {aiSignal && <AISignalDisplay signal={aiSignal} />}
              <SellStrategyForm
                coin={selectedCoin}
                onSave={handleSaveStrategy}
                onCancel={() => {
                  setShowStrategyForm(false);
                  setSelectedCoin(null);
                  setAiSignal(null);
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
