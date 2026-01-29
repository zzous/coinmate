import axios from 'axios';

// Upbit API 기본 URL
const UPBIT_API_BASE_URL = 'https://api.upbit.com/v1';

// 기본 마켓 리스트 (API 실패 시 fallback)
export const DEFAULT_UPBIT_MARKETS = [
  'KRW-BTC',   // Bitcoin
  'KRW-ETH',   // Ethereum
  'KRW-LINK',  // Chainlink
  'KRW-DOGE',  // Dogecoin
  'KRW-XRP',   // Ripple
  'KRW-SOL',   // Solana
  'KRW-ADA',   // Cardano
  'KRW-DOT',   // Polkadot
  'KRW-AVAX',  // Avalanche
  'KRW-ATOM',  // Cosmos
] as const;

// 동적으로 가져온 전체 마켓 리스트 (캐시)
let cachedAllMarkets: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1시간 캐시

/**
 * 업비트에서 거래량 기준 상위 KRW 마켓을 가져옵니다 (페이징 지원)
 * BTC와 ETH는 항상 포함됩니다.
 * @param offset 시작 인덱스 (기본값: 0)
 * @param limit 가져올 마켓 개수 (기본값: 10)
 * @returns 마켓 코드 배열
 */
export async function getTopMarkets(offset: number = 0, limit: number = 20): Promise<string[]> {
  const now = Date.now();
  
  // 캐시가 유효하지 않으면 전체 마켓 리스트 다시 로드
  if (!cachedAllMarkets || (now - cacheTimestamp) >= CACHE_DURATION) {
    await loadAllMarkets();
  }
  
  // 캐시된 전체 마켓 리스트에서 페이징된 결과 반환
  if (cachedAllMarkets) {
    return cachedAllMarkets.slice(offset, offset + limit);
  }
  
  // 캐시가 없으면 기본 마켓 반환
  return DEFAULT_UPBIT_MARKETS.slice(offset, offset + limit) as unknown as string[];
}

/**
 * 전체 마켓 리스트를 로드하여 캐시에 저장합니다
 */
async function loadAllMarkets(): Promise<void> {

  try {
    // 1단계: 모든 마켓 목록 가져오기
    const marketsResponse = await axios.get<Array<{ market: string; korean_name: string; english_name: string }>>(
      `${UPBIT_API_BASE_URL}/market/all`,
      {
        params: { isDetails: false },
        timeout: 10000,
      }
    );

    // KRW 마켓만 필터링
    const krwMarkets = marketsResponse.data
      .filter((m) => m.market.startsWith('KRW-'))
      .map((m) => m.market);

    if (krwMarkets.length === 0) {
      console.warn('KRW 마켓을 찾을 수 없음, 기본 마켓 사용');
      cachedAllMarkets = DEFAULT_UPBIT_MARKETS as unknown as string[];
      cacheTimestamp = Date.now();
      return;
    }

    // 2단계: 모든 KRW 마켓의 시세 정보 가져오기 (거래량 기준 정렬)
    // 업비트 API는 최대 200개까지 한 번에 요청 가능하므로 배치로 나눠서 요청
    const BATCH_SIZE = 200;
    const allTickers: UpbitTicker[] = [];

    for (let i = 0; i < krwMarkets.length; i += BATCH_SIZE) {
      const batch = krwMarkets.slice(i, i + BATCH_SIZE);
      
      try {
        const tickersResponse = await axios.get<UpbitTicker[]>(
          `${UPBIT_API_BASE_URL}/ticker`,
          {
            params: {
              markets: batch.join(','),
            },
            timeout: 10000,
          }
        );
        
        if (Array.isArray(tickersResponse.data)) {
          allTickers.push(...tickersResponse.data);
        }
        
        // Rate limit 방지를 위해 배치 간 지연
        if (i + BATCH_SIZE < krwMarkets.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        } catch {
          // 개별 배치 실패는 무시하고 계속 진행
        }
    }

    // 24시간 누적 거래대금(acc_trade_price_24h) 기준으로 정렬
    const sortedTickers = allTickers
      .filter((ticker) => ticker.acc_trade_price_24h > 0) // 거래량이 있는 것만
      .sort((a, b) => b.acc_trade_price_24h - a.acc_trade_price_24h)
      .map((ticker) => ticker.market);

    // BTC와 ETH는 항상 포함 (필수 마켓)
    const requiredMarkets = ['KRW-BTC', 'KRW-ETH'];
    const finalMarkets: string[] = [];
    const addedMarkets = new Set<string>();
    
    // 먼저 필수 마켓 추가 (BTC, ETH)
    for (const required of requiredMarkets) {
      finalMarkets.push(required);
      addedMarkets.add(required);
    }
    
    // 나머지 마켓 추가 (필수 마켓 제외, 전체 마켓)
    for (const market of sortedTickers) {
      if (!addedMarkets.has(market)) {
        finalMarkets.push(market);
        addedMarkets.add(market);
      }
    }

    // 전체 마켓 리스트를 캐시에 저장
    cachedAllMarkets = finalMarkets;
    cacheTimestamp = Date.now();
  } catch (error) {
    console.warn('[Upbit] 전체 마켓 조회 실패, 기본 마켓 사용:', error);
    // 에러 발생 시 기본 마켓을 캐시에 저장
    cachedAllMarkets = DEFAULT_UPBIT_MARKETS as unknown as string[];
    cacheTimestamp = Date.now();
  }
}

// 기본 export (하위 호환성 유지)
export const UPBIT_MARKETS = DEFAULT_UPBIT_MARKETS;

export interface UpbitTicker {
  market: string;
  trade_date: string;
  trade_time: string;
  trade_date_kst: string;
  trade_time_kst: string;
  trade_timestamp: number;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  prev_closing_price: number;
  change: 'RISE' | 'FALL' | 'EVEN';
  change_price: number;
  change_rate: number;
  signed_change_price: number;
  signed_change_rate: number;
  trade_volume: number;
  acc_trade_price: number;
  acc_trade_price_24h: number;
  acc_trade_volume: number;
  acc_trade_volume_24h: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
  timestamp: number;
}

/**
 * Upbit API에서 시세 정보를 가져옵니다
 * @param markets 마켓 코드 배열 (예: ['KRW-BTC', 'KRW-ETH'])
 * @returns UpbitTicker 배열
 */
export async function getUpbitTickers(
  markets?: string[]
): Promise<UpbitTicker[]> {
  // markets가 제공되지 않으면 상위 10개 마켓 자동 조회 (BTC, ETH 포함)
  if (!markets || markets.length === 0) {
    markets = await getTopMarkets(0, 20);
  }
  try {
    // Upbit API는 여러 마켓을 한번에 요청할 수 있지만, 일부 마켓이 없으면 전체가 실패할 수 있음
    // 따라서 각 마켓을 개별적으로 요청하거나, 배치로 나눠서 요청
    const marketsParam = markets.join(',');
    const response = await axios.get<UpbitTicker[]>(
      `${UPBIT_API_BASE_URL}/ticker`,
      {
        params: {
          markets: marketsParam,
        },
        timeout: 10000, // 10초 타임아웃
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    // 응답이 배열이 아닌 경우 (에러 응답)
    if (!Array.isArray(response.data)) {
      // 개별 마켓으로 재시도 (rate limit 방지를 위해 지연 추가)
      const results: UpbitTicker[] = [];
      for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        
        // 첫 번째 요청이 아니면 지연
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        try {
          const singleResponse = await axios.get<UpbitTicker[]>(
            `${UPBIT_API_BASE_URL}/ticker`,
            {
              params: { markets: market },
              timeout: 5000,
            }
          );
          if (Array.isArray(singleResponse.data) && singleResponse.data.length > 0) {
            results.push(singleResponse.data[0]);
          }
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 429) {
            // 429 에러면 더 긴 지연 후 재시도 (로그 제거)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              const retryResponse = await axios.get<UpbitTicker[]>(
                `${UPBIT_API_BASE_URL}/ticker`,
                {
                  params: { markets: market },
                  timeout: 5000,
                }
              );
              if (Array.isArray(retryResponse.data) && retryResponse.data.length > 0) {
                results.push(retryResponse.data[0]);
              }
            } catch {
              // 재시도 실패는 조용히 무시
            }
          }
          // 개별 마켓 실패는 조용히 무시하고 계속 진행
        }
      }
      return results;
    }

    return response.data;
  } catch (error) {
    // 전체 요청 실패 시 개별 마켓으로 재시도
    if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 429)) {
      // 로그 제거 (너무 많이 출력됨)
      const results: UpbitTicker[] = [];
      
      // Rate limit 방지를 위해 각 요청 사이에 지연 추가
      for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        
        // 첫 번째 요청이 아니면 지연 (429 에러인 경우 더 긴 지연)
        if (i > 0) {
          const delay = error.response?.status === 429 ? 200 : 150; // 429면 200ms, 아니면 150ms
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        try {
          const singleResponse = await axios.get<UpbitTicker[]>(
            `${UPBIT_API_BASE_URL}/ticker`,
            {
              params: { markets: market },
              timeout: 5000,
            }
          );
          if (Array.isArray(singleResponse.data) && singleResponse.data.length > 0) {
            results.push(singleResponse.data[0]);
          }
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 429) {
            // 429 에러면 더 긴 지연 후 재시도 (로그 제거)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              const retryResponse = await axios.get<UpbitTicker[]>(
                `${UPBIT_API_BASE_URL}/ticker`,
                {
                  params: { markets: market },
                  timeout: 5000,
                }
              );
              if (Array.isArray(retryResponse.data) && retryResponse.data.length > 0) {
                results.push(retryResponse.data[0]);
              }
            } catch {
              // 재시도 실패는 조용히 무시
            }
          }
          // 모든 에러는 조용히 무시하고 계속 진행 (404 포함)
        }
      }
      
      // 일부 마켓이라도 성공하면 결과 반환, 모두 실패하면 빈 배열 반환
      if (results.length > 0) {
        return results;
      }
      
      // 모든 마켓이 실패한 경우 빈 배열 반환 (에러를 throw하지 않음)
      // 로그 제거 (너무 많이 출력됨)
      return [];
    }
    
    // 404나 429가 아닌 다른 에러인 경우
    if (axios.isAxiosError(error)) {
      // 네트워크 오류나 타임아웃 등은 조용히 빈 배열 반환
      return []; // 에러를 throw하지 않고 빈 배열 반환
    }
    
    // 알 수 없는 에러도 빈 배열 반환 (로그 제거)
    return [];
  }
}

/**
 * 마켓 코드에서 심볼 추출 (KRW-BTC -> BTC)
 */
export function extractSymbol(market: string): string {
  return market.replace('KRW-', '');
}

/**
 * 코인 이름 매핑
 */
const COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  ADA: 'Cardano',
  XRP: 'Ripple',
  DOGE: 'Dogecoin',
  DOT: 'Polkadot',
  AVAX: 'Avalanche',
  LINK: 'Chainlink',
  ATOM: 'Cosmos',
};

export function getCoinName(symbol: string): string {
  return COIN_NAMES[symbol] || symbol;
}

/**
 * Upbit API에서 캔들(가격 히스토리) 데이터를 가져옵니다
 * @param market 마켓 코드 (예: 'KRW-BTC')
 * @param count 조회할 캔들 개수 (기본값: 200)
 * @returns 가격 배열 (최신순)
 */
interface UpbitCandle {
  trade_price?: number;
  closing_price?: number;
  [key: string]: unknown;
}

export async function getUpbitCandles(
  market: string,
  count: number = 200,
  retryCount: number = 0
): Promise<number[]> {
  // 마켓 코드 유효성 검사
  if (!market || !market.startsWith('KRW-')) {
    return [];
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1초

  try {
    // count는 1-200 사이여야 함
    const validCount = Math.max(1, Math.min(count, 200));
    
    const response = await axios.get<UpbitCandle[]>(
      `${UPBIT_API_BASE_URL}/candles/days`,
      {
        params: {
          market: market,
          count: validCount,
        },
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    // 응답이 배열이 아니거나 비어있으면 빈 배열 반환
    if (!Array.isArray(response.data) || response.data.length === 0) {
      return [];
    }

    // 종가(close) 기준으로 가격 배열 생성 (최신순)
    // 업비트 API는 최신 데이터가 배열의 첫 번째 요소
    const prices = response.data
      .map((candle) => {
        // 업비트 캔들 데이터 구조: trade_price 또는 closing_price 사용
        return (candle.trade_price || candle.closing_price || 0) as number;
      })
      .filter((price) => price > 0);

    // 이미 최신순이므로 reverse 불필요 (업비트 API가 최신순으로 반환)
    return prices;
  } catch (error) {
    // 429 Rate Limit 에러인 경우 재시도
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      if (retryCount < MAX_RETRIES) {
        // 지수 백오프: 1초, 2초, 4초
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return getUpbitCandles(market, count, retryCount + 1);
      }
      // 최대 재시도 횟수 초과 시 빈 배열 반환
      return [];
    }

    // 400 Bad Request는 마켓 코드가 잘못되었거나 파라미터 오류
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        // 400 에러는 조용히 무시
        return [];
      } else if (error.response?.status === 404) {
        // 404 에러는 조용히 무시
        return [];
      }
    }
    
    // 기타 에러는 조용히 빈 배열 반환
    return [];
  }
}

