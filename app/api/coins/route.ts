import { NextResponse } from 'next/server';
import { Coin } from '@/types';

// 실제 구현 시에는 거래소 API를 연동해야 합니다
// 예: Binance, Upbit, Coinbase 등

export async function GET() {
  try {
    // 모의 코인 데이터
    // 실제로는 거래소 API에서 가격 정보를 가져와야 합니다
    const mockCoins: Coin[] = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 43250.50,
        change24h: 2.45,
        volume24h: 28500000000,
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 2650.75,
        change24h: -1.23,
        volume24h: 12500000000,
      },
      {
        symbol: 'BNB',
        name: 'BNB',
        price: 315.20,
        change24h: 0.85,
        volume24h: 1200000000,
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: 98.45,
        change24h: 5.67,
        volume24h: 2500000000,
      },
      {
        symbol: 'ADA',
        name: 'Cardano',
        price: 0.52,
        change24h: -2.15,
        volume24h: 450000000,
      },
    ];

    return NextResponse.json(mockCoins);
  } catch (error) {
    console.error('코인 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '코인 데이터를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

