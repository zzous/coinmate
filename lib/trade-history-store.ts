import { createSupabaseClient } from '@/lib/supabase-client';
import type { TradeHistory } from '@/types';

type TradeRow = {
  id: string;
  user_id: string;
  coin_symbol: string;
  action: 'buy' | 'sell';
  price: number;
  amount: number;
  strategy_id: string | null;
  executed_at: string;
};

function fromRow(row: TradeRow): TradeHistory {
  return {
    id: row.id,
    coinSymbol: row.coin_symbol,
    action: row.action,
    price: Number(row.price),
    amount: Number(row.amount),
    timestamp: row.executed_at,
    strategyId: row.strategy_id ?? undefined,
  };
}

export async function listMyTrades(limit: number = 50): Promise<TradeHistory[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('trade_history')
    .select('id,user_id,coin_symbol,action,price,amount,strategy_id,executed_at')
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('거래 히스토리 조회 실패:', error);
    return [];
  }

  return (data as TradeRow[]).map(fromRow);
}

export async function createMyTrade(input: {
  coinSymbol: string;
  action: 'buy' | 'sell';
  price: number;
  amount: number;
  strategyId?: string;
  executedAt?: string;
}): Promise<TradeHistory | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('trade_history')
    .insert({
      coin_symbol: input.coinSymbol,
      action: input.action,
      price: input.price,
      amount: input.amount,
      strategy_id: input.strategyId ?? null,
      executed_at: input.executedAt ?? new Date().toISOString(),
    })
    .select('id,user_id,coin_symbol,action,price,amount,strategy_id,executed_at')
    .single();

  if (error) {
    console.error('거래 히스토리 저장 실패:', error);
    return null;
  }

  return fromRow(data as TradeRow);
}


