import { Coin } from '@/types';
import { extractSymbol, getCoinName } from './upbit';

// Upbit WebSocket API URL
const UPBIT_WS_URL = 'wss://api.upbit.com/websocket/v1';

export interface UpbitTickerMessage {
  type: string;
  code: string;
  trade_price: number;
  signed_change_rate: number;
  acc_trade_price_24h: number;
  timestamp: number;
}

/**
 * Upbit WebSocket 클라이언트 클래스
 */
export class UpbitWebSocketClient {
  public ws: WebSocket | null = null; // 연결 상태 확인을 위해 public으로 변경
  private markets: string[];
  private onMessage: (coins: Coin[]) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // 재시도 횟수 증가
  private reconnectDelay = 1000;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false;

  constructor(markets: string[], onMessage: (coins: Coin[]) => void) {
    this.markets = markets;
    this.onMessage = onMessage;
  }

  /**
   * WebSocket 연결 시작
   */
  connect(): void {
    // 이미 연결 중이거나 연결되어 있으면 무시
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    // 수동으로 연결 해제한 경우 재연결하지 않음
    if (this.isManualDisconnect) {
      return;
    }

    try {
      console.log(`WebSocket 연결 시도 (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
      this.ws = new WebSocket(UPBIT_WS_URL);

      this.ws.onopen = () => {
        console.log('✅ Upbit WebSocket 연결 성공', this.markets);
        this.reconnectAttempts = 0;
        
        // 구독 요청 전송
        const subscribeMessage = [
          { ticket: 'coinmate' },
          {
            type: 'ticker',
            codes: this.markets,
          },
        ];
        const messageStr = JSON.stringify(subscribeMessage);
        console.log('📤 구독 요청 전송:', messageStr);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(messageStr);
        }
      };

      this.ws.onmessage = async (event) => {
        try {
          let text: string;

          // 데이터 타입에 따라 적절히 처리
          if (event.data instanceof ArrayBuffer) {
            // ArrayBuffer인 경우
            const decoder = new TextDecoder('utf-8');
            text = decoder.decode(event.data);
          } else if (event.data instanceof Blob) {
            // Blob인 경우
            text = await event.data.text();
          } else if (typeof event.data === 'string') {
            // 이미 문자열인 경우
            text = event.data;
          } else {
            console.warn('알 수 없는 데이터 타입:', typeof event.data);
            return;
          }

          // JSON 파싱
          const data: UpbitTickerMessage = JSON.parse(text);

          // 틱 데이터를 Coin 타입으로 변환
          const coin = this.convertTickerToCoin(data);
          if (coin) {
            // 단일 코인 업데이트를 배열로 변환하여 전달
            this.onMessage([coin]);
          } else {
            console.warn('코인 변환 실패:', data);
          }
        } catch (error) {
          // JSON 파싱 오류는 무시 (Upbit에서 가끔 잘못된 형식의 메시지 전송)
          if (error instanceof SyntaxError) {
            return;
          }
          console.log('WebSocket 메시지 파싱 오류:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.log('❌ WebSocket 오류:', error);
        // onclose에서 재연결 처리하므로 여기서는 로그만
      };

      this.ws.onclose = (event) => {
        const wasOpen = event.wasClean;
        console.log(`WebSocket 연결 종료 (wasClean: ${wasOpen}, code: ${event.code}, reason: ${event.reason || '없음'})`);
        
        // 수동으로 연결 해제한 경우 재연결하지 않음
        if (this.isManualDisconnect) {
          return;
        }

        // 정상 종료가 아니면 재연결 시도
        if (!wasOpen) {
          this.handleReconnect();
        }
      };
    } catch (error) {
      console.log('WebSocket 연결 실패:', error);
      this.handleReconnect();
    }
  }

  /**
   * 틱 메시지를 Coin 타입으로 변환
   */
  private convertTickerToCoin(ticker: unknown): Coin | null {
    // 타입 체크
    if (!ticker || typeof ticker !== 'object') {
      return null;
    }

    const tickerData = ticker as Record<string, unknown>;

    // ticker 타입이 아니거나 code가 없으면 무시
    if (tickerData.type !== 'ticker' || typeof tickerData.code !== 'string') {
      return null;
    }

    try {
      const symbol = extractSymbol(tickerData.code);
      const signedChangeRate = typeof tickerData.signed_change_rate === 'number' 
        ? tickerData.signed_change_rate 
        : 0;
      const change24h = signedChangeRate * 100;
      const tradePrice = typeof tickerData.trade_price === 'number' 
        ? tickerData.trade_price 
        : 0;
      const accTradePrice24h = typeof tickerData.acc_trade_price_24h === 'number' 
        ? tickerData.acc_trade_price_24h 
        : 0;

      return {
        symbol,
        name: getCoinName(symbol),
        price: tradePrice,
        change24h: parseFloat(change24h.toFixed(2)),
        volume24h: accTradePrice24h,
      };
    } catch (error) {
      console.log('코인 변환 오류:', error, ticker);
      return null;
    }
  }

  /**
   * 재연결 처리
   */
  private handleReconnect(): void {
    // 이미 재연결 예약이 있으면 무시
    if (this.reconnectTimeoutId) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`❌ 최대 재연결 시도 횟수 초과 (${this.maxReconnectAttempts}회)`);
      console.log('수동으로 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.');
      return;
    }

    this.reconnectAttempts++;
    // 지수 백오프: 1초, 2초, 4초, 8초... 최대 30초
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(`⏳ ${Math.round(delay / 1000)}초 후 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      // 기존 연결 정리
      if (this.ws) {
        try {
          this.ws.close();
        } catch (e) {
          // 무시
        }
        this.ws = null;
      }
      this.connect();
    }, delay);
  }

  /**
   * WebSocket 연결 종료
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    
    // 재연결 타이머 취소
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      try {
        // 연결 상태에 따라 안전하게 종료
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close(1000, 'Manual disconnect');
        }
      } catch (error) {
        console.log('WebSocket 종료 오류:', error);
      }
      this.ws = null;
    }
  }

  /**
   * 구독 마켓 업데이트
   */
  updateMarkets(markets: string[]): void {
    this.markets = markets;
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // 기존 구독 해제 후 새로 구독
      const unsubscribeMessage = [
        { ticket: 'coinmate' },
        {
          type: 'ticker',
          codes: [],
          isOnlySnapshot: false,
          isOnlyRealtime: false,
        },
      ];
      this.ws.send(JSON.stringify(unsubscribeMessage));

      // 새 구독
      const subscribeMessage = [
        { ticket: 'coinmate' },
        {
          type: 'ticker',
          codes: markets,
        },
      ];
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }
}

