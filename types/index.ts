export interface Coin {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
}

export interface SellStrategy {
  id?: string;
  coinSymbol: string;
  strategyType: 'profit-target' | 'stop-loss' | 'ai-signal' | 'time-based';
  targetPrice?: number;
  stopLossPrice?: number;
  profitPercentage?: number;
  lossPercentage?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface AISignal {
  coinSymbol: string;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
  timestamp: string;
}

export interface TradeHistory {
  id?: string;
  coinSymbol: string;
  action: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp: string;
  strategyId?: string;
}

