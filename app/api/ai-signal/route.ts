import { NextRequest, NextResponse } from 'next/server';
import { AISignal } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { coinSymbol, currentPrice, priceHistory } = await request.json();

    if (!coinSymbol) {
      return NextResponse.json(
        { error: '코인 심볼이 필요합니다' },
        { status: 400 }
      );
    }

    // TODO: 실제 AI 모델 연동 (OpenAI, 자체 모델 등)
    // 현재는 모의 AI 신호를 생성합니다
    const signal = await generateMockAISignal(coinSymbol, currentPrice, priceHistory);

    return NextResponse.json(signal);
  } catch (error) {
    console.error('AI 신호 생성 오류:', error);
    return NextResponse.json(
      { error: 'AI 신호 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

async function generateMockAISignal(
  coinSymbol: string,
  currentPrice?: number,
  priceHistory?: number[]
): Promise<AISignal> {
  // 실제 구현 시에는 AI 모델을 사용하여 분석해야 합니다
  // 예: 기술적 지표 분석, 시장 감정 분석, 패턴 인식 등

  // 모의 신호 생성
  const signals: AISignal['signal'][] = ['buy', 'sell', 'hold'];
  const randomSignal = signals[Math.floor(Math.random() * signals.length)];
  const confidence = 0.65 + Math.random() * 0.3; // 0.65 ~ 0.95

  const reasoningMap = {
    sell: `현재 가격이 저항선 근처에 위치하고 있으며, 거래량 감소와 함께 상승 모멘텀이 약화되고 있습니다. RSI 지표가 과매수 구간에 진입했으며, 단기 조정 가능성이 높아 보입니다.`,
    buy: `지지선 근처에서 반등 신호가 보이며, 거래량이 증가하고 있습니다. 기술적 지표들이 긍정적인 신호를 보이고 있어 상승 가능성이 있습니다.`,
    hold: `현재 시장이 횡보 중이며, 명확한 방향성이 보이지 않습니다. 추가 시장 데이터를 관찰한 후 결정하는 것이 좋겠습니다.`,
  };

  return {
    coinSymbol,
    signal: randomSignal,
    confidence,
    reasoning: reasoningMap[randomSignal],
    timestamp: new Date().toISOString(),
  };
}

