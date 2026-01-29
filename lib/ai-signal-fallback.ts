import { AISignal } from '@/types';
import { calculateRSI, calculateMACD, calculateBollingerBands, calculateMA } from './technical-indicators';

/**
 * 기술적 지표 기반 모의 AI 신호 생성 (OpenAI API가 없을 때 사용)
 */
export async function generateMockAISignal(
  coinSymbol: string,
  currentPrice?: number,
  priceHistory?: number[]
): Promise<AISignal> {
  if (!currentPrice || !priceHistory || priceHistory.length < 20) {
    // 데이터 부족 시 기본 신호
    return {
      coinSymbol,
      signal: 'hold',
      confidence: 0.5,
      reasoning: '데이터가 충분하지 않아 보유를 권장합니다.',
      timestamp: new Date().toISOString(),
    };
  }

  // 기술적 지표 계산
  const rsi = calculateRSI(priceHistory);
  const macd = calculateMACD(priceHistory);
  const bb = calculateBollingerBands(priceHistory);
  const ma20 = calculateMA(priceHistory, 20);
  const ma50 = priceHistory.length >= 50 ? calculateMA(priceHistory, 50) : ma20;

  // 신호 결정 로직
  let signal: 'buy' | 'sell' | 'hold' = 'hold';
  let confidence = 0.6;
  const reasons: string[] = [];

  // RSI 기반 판단
  if (rsi > 70) {
    signal = 'sell';
    confidence += 0.15;
    reasons.push(`RSI가 ${rsi.toFixed(1)}로 과매수 구간에 진입했습니다.`);
  } else if (rsi < 30) {
    signal = 'buy';
    confidence += 0.15;
    reasons.push(`RSI가 ${rsi.toFixed(1)}로 과매도 구간에 진입했습니다.`);
  } else {
    reasons.push(`RSI가 ${rsi.toFixed(1)}로 중립 구간입니다.`);
  }

  // MACD 기반 판단
  if (macd.histogram > 0) {
    if (signal === 'hold') signal = 'buy';
    confidence += 0.1;
    reasons.push(`MACD가 상승 신호를 보이고 있습니다.`);
  } else if (macd.histogram < 0) {
    if (signal === 'hold') signal = 'sell';
    confidence += 0.1;
    reasons.push(`MACD가 하락 신호를 보이고 있습니다.`);
  }

  // 이동평균선 기반 판단
  if (currentPrice > ma20 && ma20 > ma50) {
    if (signal === 'hold') signal = 'buy';
    confidence += 0.1;
    reasons.push(`현재가가 이동평균선 위에 있으며 상승 추세입니다.`);
  } else if (currentPrice < ma20 && ma20 < ma50) {
    if (signal === 'hold') signal = 'sell';
    confidence += 0.1;
    reasons.push(`현재가가 이동평균선 아래에 있으며 하락 추세입니다.`);
  }

  // 볼린저 밴드 기반 판단
  if (currentPrice > bb.upper) {
    if (signal !== 'buy') {
      signal = 'sell';
      confidence += 0.05;
    }
    reasons.push(`현재가가 볼린저 밴드 상단을 돌파했습니다.`);
  } else if (currentPrice < bb.lower) {
    if (signal !== 'sell') {
      signal = 'buy';
      confidence += 0.05;
    }
    reasons.push(`현재가가 볼린저 밴드 하단 아래로 하락했습니다.`);
  }

  // 신뢰도 정규화 (0.5 ~ 0.95)
  confidence = Math.min(0.95, Math.max(0.5, confidence));

  const reasoning = reasons.length > 0
    ? reasons.join(' ') + ' 종합적으로 ' + (signal === 'buy' ? '매수를' : signal === 'sell' ? '매도를' : '보유를') + ' 권장합니다.'
    : '기술적 지표를 종합 분석한 결과입니다.';

  return {
    coinSymbol,
    signal,
    confidence,
    reasoning,
    timestamp: new Date().toISOString(),
  };
}

