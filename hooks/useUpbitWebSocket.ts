import { useEffect, useRef, useState } from 'react';
import { Coin } from '@/types';
import { UpbitWebSocketClient } from '@/lib/upbit-websocket';
import { getTopMarkets, getUpbitTickers, extractSymbol, getCoinName } from '@/lib/upbit';

/**
 * Upbit WebSocket을 사용한 실시간 가격 업데이트 훅
 * WebSocket 연결 실패 시 REST API로 폴백합니다.
 */
export function useUpbitWebSocket() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsClientRef = useRef<UpbitWebSocketClient | null>(null);
  const coinsMapRef = useRef<Map<string, Coin>>(new Map());
  const isInitialSnapshotRef = useRef(true);
  const isMountedRef = useRef(true);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // REST API로 초기 데이터 로드 (폴백)
  const loadCoinsFromAPI = async () => {
    try {
      const tickers = await getUpbitTickers();
      const apiCoins: Coin[] = tickers.map((ticker) => {
        const symbol = extractSymbol(ticker.market);
        const change24h = ticker.signed_change_rate * 100;

        return {
          symbol,
          name: getCoinName(symbol),
          price: ticker.trade_price,
          change24h: parseFloat(change24h.toFixed(2)),
          volume24h: ticker.acc_trade_price_24h,
        };
      });

      if (isMountedRef.current) {
        // 맵에 반영
        apiCoins.forEach((coin) => {
          coinsMapRef.current.set(coin.symbol, coin);
        });

        // 상태 업데이트
        const allCoins = Array.from(coinsMapRef.current.values());
        allCoins.sort((a, b) => b.price - a.price);
        setCoins(allCoins);
      }
    } catch (error) {
      console.error('REST API로 코인 데이터 로드 실패:', error);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // 비동기로 마켓 리스트 가져오기 및 WebSocket 연결
    (async () => {
      try {
        // 먼저 REST API로 초기 데이터 로드
        await loadCoinsFromAPI();

        // 상위 20개 마켓 가져오기
        const markets = await getTopMarkets(20);

        if (!isMountedRef.current) {
          return;
        }

        // WebSocket 클라이언트 생성
        const wsClient = new UpbitWebSocketClient(markets, (updatedCoins: Coin[]) => {
          // 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
          if (!isMountedRef.current) {
            return;
          }

          // WebSocket 연결 성공 표시
          if (!wsConnected) {
            setWsConnected(true);
            // REST API 폴백 중지
            if (fallbackIntervalRef.current) {
              clearInterval(fallbackIntervalRef.current);
              fallbackIntervalRef.current = null;
            }
          }

          // 초기 스냅샷인지 실시간 업데이트인지 구분
          if (isInitialSnapshotRef.current) {
            isInitialSnapshotRef.current = false;
          }
          
          // 코인 데이터를 맵에 반영
          updatedCoins.forEach((coin) => {
            const existing = coinsMapRef.current.get(coin.symbol);
            // 가격이 변경되었을 때만 업데이트 (초기 스냅샷은 항상 업데이트)
            if (isInitialSnapshotRef.current || !existing || existing.price !== coin.price) {
              coinsMapRef.current.set(coin.symbol, coin);
            }
          });

          // 맵의 모든 코인을 배열로 변환하여 상태 업데이트
          const allCoins = Array.from(coinsMapRef.current.values());
          // 가격 기준으로 내림차순 정렬
          allCoins.sort((a, b) => b.price - a.price);
          
          // 컴포넌트가 마운트되어 있을 때만 상태 업데이트
          if (isMountedRef.current) {
            setCoins(allCoins);
          }
        });

        wsClientRef.current = wsClient;
        
        // WebSocket 연결 시도
        wsClient.connect();

        // WebSocket 연결 실패 시 REST API 폴백 (30초마다)
        const checkConnection = setInterval(() => {
          // WebSocket 연결 상태 확인
          const ws = wsClientRef.current?.ws;
          const isWsOpen = ws && ws.readyState === WebSocket.OPEN;
          
          if (!isWsOpen && isMountedRef.current) {
            console.log('WebSocket 미연결, REST API로 데이터 업데이트...');
            loadCoinsFromAPI();
          }
        }, 30000); // 30초마다

        fallbackIntervalRef.current = checkConnection;
      } catch (error) {
        console.error('WebSocket 초기화 실패:', error);
      }
    })();

    // 클린업
    return () => {
      isMountedRef.current = false;
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      // cleanup 시점의 맵 참조 저장
      const coinsMap = coinsMapRef.current;
      if (coinsMap) {
        coinsMap.clear();
      }
      isInitialSnapshotRef.current = true;
      setWsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // wsConnected는 콜백에서만 변경되므로 의존성 제외

  return coins;
}
