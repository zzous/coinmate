import { NextRequest, NextResponse } from 'next/server';
import { AISignal } from '@/types';
import { getUpbitCandles, getUpbitTickers, extractSymbol } from '@/lib/upbit';
import { generateTechnicalSummary } from '@/lib/technical-indicators';
import { generateAISignalWithOpenAI } from '@/lib/openai';
import { generateMockAISignal } from '@/lib/ai-signal-fallback';

export async function POST(request: NextRequest) {
  try {
    const { coinSymbol, currentPrice, priceHistory } = await request.json();

    if (!coinSymbol) {
      return NextResponse.json(
        { error: '코인 심볼이 필요합니다' },
        { status: 400 }
      );
    }

    // 하이브리드 접근: 기술적 지표 + AI 분석
    const signal = await generateHybridAISignal(
      coinSymbol,
      currentPrice,
      priceHistory
    );

    return NextResponse.json(signal);
  } catch (error) {
    console.error('AI 신호 생성 오류:', error);
    
    // 에러 발생 시 모의 데이터로 폴백
    try {
      const { coinSymbol, currentPrice, priceHistory } = await request.json();
      const fallbackSignal = await generateMockAISignal(
        coinSymbol,
        currentPrice,
        priceHistory
      );
      return NextResponse.json(fallbackSignal);
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'AI 신호 생성 중 오류가 발생했습니다', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
}

/**
 * 하이브리드 AI 신호 생성: 기술적 지표 + OpenAI 분석
 */
async function generateHybridAISignal(
  coinSymbol: string,
  currentPrice?: number,
  priceHistory?: number[]
): Promise<AISignal> {
  // 1. 가격 데이터 수집
  const market = `KRW-${coinSymbol}`;
  let prices: number[] = priceHistory || [];
  let price = currentPrice;
  let priceChange24h = 0;
  let volume24h = 0;

  try {
    // Upbit에서 최신 시세 정보 가져오기
    const tickers = await getUpbitTickers([market]);
    if (tickers.length > 0) {
      const ticker = tickers[0];
      price = ticker.trade_price;
      priceChange24h = ticker.signed_change_rate * 100;
      volume24h = ticker.acc_trade_price_24h;
    }

    // 가격 히스토리가 없으면 Upbit에서 가져오기
    if (prices.length === 0) {
      const candles = await getUpbitCandles(market, 200);
      if (candles.length > 0) {
        prices = candles;
        // 현재가를 맨 앞에 추가
        if (price) {
          prices.unshift(price);
        }
      }
    } else if (price) {
      // 제공된 히스토리에 현재가 추가
      prices.unshift(price);
    }
  } catch (error) {
    console.warn('Upbit 데이터 조회 실패, 제공된 데이터 사용:', error);
  }

  // 가격 데이터가 충분하지 않으면 모의 데이터 사용
  if (!price || prices.length < 20) {
    console.warn('가격 데이터 부족, 모의 신호 생성');
    return await generateMockAISignal(coinSymbol, price, prices);
  }

  // 2. 기술적 지표 계산
  const technicalSummary = generateTechnicalSummary(price, prices);

  // 3. OpenAI로 AI 분석 (API 키가 있는 경우)
  try {
    const aiSignal = await generateAISignalWithOpenAI(
      coinSymbol,
      price,
      technicalSummary,
      priceChange24h,
      volume24h
    );
    
    // API 키가 없거나 null이 반환된 경우 폴백
    if (aiSignal) {
      return aiSignal;
    }
    
    // API 키가 없으면 기술적 지표 기반 신호 생성
    return await generateMockAISignal(coinSymbol, price, prices);
  } catch (error) {
    // OpenAI API 호출 오류 발생 시 기술적 지표 기반 모의 신호 생성
    console.warn('OpenAI 분석 실패, 기술적 지표 기반 신호 생성:', error);
    return await generateMockAISignal(coinSymbol, price, prices);
  }
}

