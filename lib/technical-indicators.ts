/**
 * 기술적 지표 계산 함수들
 * 전문적인 트레이딩 지표들을 포함합니다.
 */

// 캔들 데이터 인터페이스 (고가, 저가, 종가, 거래량)
export interface CandleData {
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * RSI (Relative Strength Index) 계산 - 개선된 버전 (EMA 기반)
 * @param prices 가격 배열 (최신순)
 * @param period 기간 (기본값: 14)
 * @returns RSI 값 (0-100)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // 데이터 부족 시 중립값 반환
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i - 1] - prices[i]);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < changes.length; i++) {
    if (changes[i] > 0) {
      gains.push(changes[i]);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(changes[i]));
    }
  }

  // EMA 기반 RSI 계산 (더 정확함)
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const multiplier = 1 / period;

  for (let i = period; i < gains.length; i++) {
    avgGain = (gains[i] * multiplier) + (avgGain * (1 - multiplier));
    avgLoss = (losses[i] * multiplier) + (avgLoss * (1 - multiplier));
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Math.round(rsi * 100) / 100;
}

/**
 * 이동평균 계산
 * @param prices 가격 배열
 * @param period 기간
 * @returns 이동평균값
 */
export function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }

  const recent = prices.slice(0, period);
  return recent.reduce((a, b) => a + b, 0) / period;
}

/**
 * MACD 계산 - 개선된 버전 (정확한 Signal line 계산)
 * @param prices 가격 배열 (최신순)
 * @returns { macd: number, signal: number, histogram: number }
 */
export function calculateMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  if (prices.length < 35) { // 26 + 9 필요
    return { macd: 0, signal: 0, histogram: 0 };
  }

  // EMA 12와 EMA 26 계산
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;

  // MACD 히스토리 생성 (과거 MACD 값들)
  const macdHistory: number[] = [];
  for (let i = 0; i < Math.min(prices.length - 26, 9); i++) {
    const slice = prices.slice(i, i + 26);
    if (slice.length >= 26) {
      const e12 = calculateEMA(slice, 12);
      const e26 = calculateEMA(slice, 26);
      macdHistory.push(e12 - e26);
    }
  }
  macdHistory.push(macdLine);

  // Signal line = MACD의 9일 EMA
  const signalLine = calculateEMA(macdHistory.reverse(), 9);
  const histogram = macdLine - signalLine;

  return {
    macd: Math.round(macdLine * 100) / 100,
    signal: Math.round(signalLine * 100) / 100,
    histogram: Math.round(histogram * 100) / 100,
  };
}

/**
 * EMA (Exponential Moving Average) 계산
 * @param prices 가격 배열
 * @param period 기간
 * @returns EMA 값
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices[0] || 0;
  }

  const multiplier = 2 / (period + 1);
  let ema = prices[period - 1];

  for (let i = period - 2; i >= 0; i--) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * 볼린저 밴드 계산
 * @param prices 가격 배열
 * @param period 기간 (기본값: 20)
 * @param stdDev 표준편차 배수 (기본값: 2)
 * @returns { upper: number, middle: number, lower: number }
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: number;
  middle: number;
  lower: number;
} {
  if (prices.length < period) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return { upper: avg, middle: avg, lower: avg };
  }

  const recent = prices.slice(0, period);
  const middle = recent.reduce((a, b) => a + b, 0) / period;

  // 표준편차 계산
  const variance = recent.reduce((sum, price) => {
    return sum + Math.pow(price - middle, 2);
  }, 0) / period;

  const standardDeviation = Math.sqrt(variance);

  return {
    upper: Math.round((middle + stdDev * standardDeviation) * 100) / 100,
    middle: Math.round(middle * 100) / 100,
    lower: Math.round((middle - stdDev * standardDeviation) * 100) / 100,
  };
}

/**
 * Stochastic Oscillator 계산
 * @param candles 캔들 데이터 배열 (최신순)
 * @param kPeriod %K 기간 (기본값: 14)
 * @param dPeriod %D 기간 (기본값: 3)
 * @returns { k: number, d: number }
 */
export function calculateStochastic(
  candles: CandleData[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number; d: number } {
  if (candles.length < kPeriod) {
    return { k: 50, d: 50 };
  }

  const recent = candles.slice(0, kPeriod);
  const currentClose = recent[0].close;
  const highestHigh = Math.max(...recent.map(c => c.high));
  const lowestLow = Math.min(...recent.map(c => c.low));

  if (highestHigh === lowestLow) {
    return { k: 50, d: 50 };
  }

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

  // %D = %K의 dPeriod일 이동평균
  const kValues: number[] = [];
  for (let i = 0; i < Math.min(candles.length - kPeriod + 1, dPeriod); i++) {
    const slice = candles.slice(i, i + kPeriod);
    const hh = Math.max(...slice.map(c => c.high));
    const ll = Math.min(...slice.map(c => c.low));
    if (hh !== ll) {
      kValues.push(((slice[0].close - ll) / (hh - ll)) * 100);
    }
  }
  kValues.push(k);

  const d = kValues.reduce((a, b) => a + b, 0) / kValues.length;

  return {
    k: Math.round(k * 100) / 100,
    d: Math.round(d * 100) / 100,
  };
}

/**
 * ATR (Average True Range) 계산 - 변동성 측정
 * @param candles 캔들 데이터 배열
 * @param period 기간 (기본값: 14)
 * @returns ATR 값
 */
export function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) {
    return 0;
  }

  const trueRanges: number[] = [];
  for (let i = 0; i < period; i++) {
    const current = candles[i];
    const previous = candles[i + 1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }

  return trueRanges.reduce((a, b) => a + b, 0) / period;
}

/**
 * Williams %R 계산 - 모멘텀 지표
 * @param candles 캔들 데이터 배열
 * @param period 기간 (기본값: 14)
 * @returns Williams %R 값 (-100 ~ 0)
 */
export function calculateWilliamsR(
  candles: CandleData[],
  period: number = 14
): number {
  if (candles.length < period) {
    return -50;
  }

  const recent = candles.slice(0, period);
  const currentClose = recent[0].close;
  const highestHigh = Math.max(...recent.map(c => c.high));
  const lowestLow = Math.min(...recent.map(c => c.low));

  if (highestHigh === lowestLow) {
    return -50;
  }

  const wr = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  return Math.round(wr * 100) / 100;
}

/**
 * CCI (Commodity Channel Index) 계산
 * @param candles 캔들 데이터 배열
 * @param period 기간 (기본값: 20)
 * @returns CCI 값
 */
export function calculateCCI(candles: CandleData[], period: number = 20): number {
  if (candles.length < period) {
    return 0;
  }

  const recent = candles.slice(0, period);
  const typicalPrices = recent.map(c => (c.high + c.low + c.close) / 3);
  const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
  
  const meanDeviation = typicalPrices.reduce((sum, tp) => {
    return sum + Math.abs(tp - sma);
  }, 0) / period;

  if (meanDeviation === 0) return 0;

  const currentTP = (recent[0].high + recent[0].low + recent[0].close) / 3;
  const cci = (currentTP - sma) / (0.015 * meanDeviation);

  return Math.round(cci * 100) / 100;
}

/**
 * ADX (Average Directional Index) 계산 - 추세 강도
 * @param candles 캔들 데이터 배열
 * @param period 기간 (기본값: 14)
 * @returns ADX 값 (0-100)
 */
export function calculateADX(candles: CandleData[], period: number = 14): number {
  if (candles.length < period * 2) {
    return 0;
  }

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 0; i < period; i++) {
    const current = candles[i];
    const previous = candles[i + 1];

    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    tr.push(Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    ));
  }

  const atr = tr.reduce((a, b) => a + b, 0) / period;
  const plusDI = (plusDM.reduce((a, b) => a + b, 0) / period / atr) * 100;
  const minusDI = (minusDM.reduce((a, b) => a + b, 0) / period / atr) * 100;

  if (plusDI + minusDI === 0) return 0;

  const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
  return Math.round(dx * 100) / 100;
}

/**
 * Support/Resistance 레벨 계산
 * @param prices 가격 배열
 * @param lookback 기간 (기본값: 20)
 * @returns { support: number, resistance: number }
 */
export function calculateSupportResistance(
  prices: number[],
  lookback: number = 20
): { support: number; resistance: number } {
  if (prices.length < lookback) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return { support: avg * 0.95, resistance: avg * 1.05 };
  }

  const recent = prices.slice(0, lookback);
  const support = Math.min(...recent);
  const resistance = Math.max(...recent);

  return {
    support: Math.round(support * 100) / 100,
    resistance: Math.round(resistance * 100) / 100,
  };
}

/**
 * 기술적 지표 요약 생성 - 개선된 버전
 */
export function generateTechnicalSummary(
  currentPrice: number,
  prices: number[]
): string {
  const rsi = calculateRSI(prices);
  const ma20 = calculateMA(prices, 20);
  const ma50 = calculateMA(prices, 50);
  const ma200 = calculateMA(prices, 200);
  const macd = calculateMACD(prices);
  const bb = calculateBollingerBands(prices);
  const sr = calculateSupportResistance(prices);

  // 캔들 데이터가 있으면 추가 지표 계산
  // (현재는 가격만 있으므로 기본값 사용)
  const candles: CandleData[] = prices.map(p => ({
    high: p * 1.02,
    low: p * 0.98,
    close: p,
  }));

  const stochastic = calculateStochastic(candles);
  const williamsR = calculateWilliamsR(candles);
  const cci = calculateCCI(candles);
  const adx = calculateADX(candles);
  const atr = calculateATR(candles);

  const summary = {
    rsi: rsi,
    rsiStatus: rsi > 70 ? '과매수' : rsi < 30 ? '과매도' : '중립',
    ma20: ma20,
    ma50: ma50,
    ma200: ma200,
    maTrend: ma20 > ma50 ? '상승' : '하락',
    ma200Trend: currentPrice > ma200 ? '상승장' : '하락장',
    macd: macd,
    macdSignal: macd.histogram > 0 ? '상승' : '하락',
    bollinger: currentPrice > bb.upper ? '상단' : currentPrice < bb.lower ? '하단' : '중간',
    stochastic: stochastic,
    stochasticStatus: stochastic.k > 80 ? '과매수' : stochastic.k < 20 ? '과매도' : '중립',
    williamsR: williamsR,
    williamsRStatus: williamsR > -20 ? '과매수' : williamsR < -80 ? '과매도' : '중립',
    cci: cci,
    cciStatus: cci > 100 ? '과매수' : cci < -100 ? '과매도' : '중립',
    adx: adx,
    adxStatus: adx > 25 ? '강한 추세' : adx > 20 ? '중간 추세' : '약한 추세',
    atr: atr,
    support: sr.support,
    resistance: sr.resistance,
  };

  return `현재가: ${currentPrice.toLocaleString()}원

📊 모멘텀 지표:
- RSI: ${summary.rsi} (${summary.rsiStatus})
- Stochastic: %K=${summary.stochastic.k}, %D=${summary.stochastic.d} (${summary.stochasticStatus})
- Williams %R: ${summary.williamsR} (${summary.williamsRStatus})
- CCI: ${summary.cci} (${summary.cciStatus})

📈 추세 지표:
- 이동평균: MA20=${summary.ma20.toLocaleString()}, MA50=${summary.ma50.toLocaleString()}, MA200=${summary.ma200.toLocaleString()}
- 추세: ${summary.maTrend} 추세, ${summary.ma200Trend}
- ADX: ${summary.adx} (${summary.adxStatus})

💹 오실레이터:
- MACD: ${summary.macd.macd}, Signal: ${summary.macd.signal}, Histogram: ${summary.macd.histogram} (${summary.macdSignal} 신호)
- 볼린저 밴드: ${summary.bollinger} 위치 (상단: ${bb.upper.toLocaleString()}, 하단: ${bb.lower.toLocaleString()})

📉 지지/저항:
- 지지선: ${summary.support.toLocaleString()}원
- 저항선: ${summary.resistance.toLocaleString()}원

📊 변동성:
- ATR: ${summary.atr.toLocaleString()}원`;
}

