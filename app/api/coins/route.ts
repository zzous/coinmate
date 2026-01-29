import { NextResponse } from 'next/server';
import { Coin } from '@/types';
import { getUpbitTickers, extractSymbol, getCoinName } from '@/lib/upbit';

export async function GET() {
  try {
    // Upbit API에서 실제 시세 정보 가져오기
    const tickers = await getUpbitTickers();

    // Upbit API 응답을 Coin 타입으로 변환
    const coins: Coin[] = tickers.map((ticker) => {
      const symbol = extractSymbol(ticker.market);
      const change24h = ticker.signed_change_rate * 100; // 퍼센트로 변환

      return {
        symbol,
        name: getCoinName(symbol),
        price: ticker.trade_price,
        change24h: parseFloat(change24h.toFixed(2)),
        volume24h: ticker.acc_trade_price_24h,
      };
    });

    // 가격 기준으로 내림차순 정렬
    coins.sort((a, b) => b.price - a.price);

    return NextResponse.json(coins);
  } catch (error) {
    console.error('코인 데이터 조회 오류:', error);
    
    // 에러 발생 시 빈 배열 반환 (프론트엔드에서 처리 가능하도록)
    return NextResponse.json(
      { error: '코인 데이터를 가져오는 중 오류가 발생했습니다', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

