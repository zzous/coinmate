import { createSupabaseClient } from '@/lib/supabase-client';
import type { SellStrategy } from '@/types';

type StrategyRow = {
  id: string;
  user_id: string;
  coin_symbol: string;
  strategy_type: SellStrategy['strategyType'];
  target_price: number | null;
  stop_loss_price: number | null;
  profit_percentage: number | null;
  loss_percentage: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function fromRow(row: StrategyRow): SellStrategy {
  return {
    id: row.id,
    coinSymbol: row.coin_symbol,
    strategyType: row.strategy_type,
    targetPrice: row.target_price ?? undefined,
    stopLossPrice: row.stop_loss_price ?? undefined,
    profitPercentage: row.profit_percentage ?? undefined,
    lossPercentage: row.loss_percentage ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function toInsertRow(strategy: Omit<SellStrategy, 'id' | 'createdAt'>) {
  return {
    coin_symbol: strategy.coinSymbol,
    strategy_type: strategy.strategyType,
    target_price: strategy.targetPrice ?? null,
    stop_loss_price: strategy.stopLossPrice ?? null,
    profit_percentage: strategy.profitPercentage ?? null,
    loss_percentage: strategy.lossPercentage ?? null,
    is_active: strategy.isActive,
  };
}

export async function listMyStrategies(): Promise<SellStrategy[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('strategies')
    .select(
      'id,user_id,coin_symbol,strategy_type,target_price,stop_loss_price,profit_percentage,loss_percentage,is_active,created_at,updated_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('전략 조회 실패:', error);
    return [];
  }

  return (data as StrategyRow[]).map(fromRow);
}

export async function createMyStrategy(
  strategy: Omit<SellStrategy, 'id' | 'createdAt'>
): Promise<SellStrategy | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('strategies')
    .insert(toInsertRow(strategy))
    .select(
      'id,user_id,coin_symbol,strategy_type,target_price,stop_loss_price,profit_percentage,loss_percentage,is_active,created_at,updated_at'
    )
    .single();

  if (error) {
    console.error('전략 저장 실패:', error);
    return null;
  }

  return fromRow(data as StrategyRow);
}

export async function setMyStrategyActive(strategyId: string, isActive: boolean): Promise<boolean> {
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from('strategies')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', strategyId);

  if (error) {
    console.error('전략 활성/비활성 변경 실패:', error);
    return false;
  }

  return true;
}

export async function deleteMyStrategy(strategyId: string): Promise<boolean> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from('strategies').delete().eq('id', strategyId);

  if (error) {
    console.error('전략 삭제 실패:', error);
    return false;
  }

  return true;
}


