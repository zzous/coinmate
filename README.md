# 🤖 CoinMate

AI 기반 코인 매도 신호 분석 및 자동화 시스템

## 🎯 서비스 개요

CoinMate는 AI를 활용하여 암호화폐 시장을 분석하고, 최적의 매도 시점을 알려주는 자동화 시스템입니다.

## 🧠 핵심 기능

### 1️⃣ 코인 모니터링
- 실시간 코인 가격 조회
- 24시간 변동률 및 거래량 표시
- 주요 코인 목록 관리

### 2️⃣ AI 매도 신호 분석
- AI 기반 시장 분석
- 매도/매수/보유 신호 생성
- 신뢰도 및 분석 근거 제공

### 3️⃣ 매도 전략 설정
- **이익 실현 (Profit Target)**: 목표 가격 또는 이익률 설정
- **손절매 (Stop Loss)**: 손절 가격 또는 손실률 설정
- **AI 신호 기반**: AI 분석 결과에 따른 자동 매도
- **시간 기반**: 특정 시간에 자동 매도 (추후 구현)

### 4️⃣ 전략 관리
- 활성/비활성 전략 관리
- 전략 목록 조회 및 삭제
- 실시간 모니터링

## 🚀 시작하기

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API 설정 (선택사항)
# OPENAI_API_KEY=your_openai_api_key

# 거래소 API 설정 (선택사항)
# BINANCE_API_KEY=your_binance_api_key
# UPBIT_ACCESS_KEY=your_upbit_access_key
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📦 기술 스택

- **Next.js 16** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Supabase** - 백엔드 서비스
- **Axios** - HTTP 클라이언트

## 🔧 다음 단계

- [ ] 실제 거래소 API 연동 (Binance, Upbit 등)
- [ ] 실제 AI 모델 연동 (OpenAI, 자체 모델 등)
- [ ] WebSocket을 통한 실시간 가격 업데이트
- [ ] 자동 매도 실행 기능 (거래소 API 연동)
- [ ] 알림 시스템 (이메일, 푸시 알림)
- [ ] 거래 히스토리 및 수익률 분석
- [ ] 포트폴리오 관리 기능
- [ ] 기술적 지표 분석 (RSI, MACD, 볼린저 밴드 등)

## ⚠️ 주의사항

- 본 프로젝트는 교육 및 개발 목적으로 제작되었습니다.
- 실제 거래에 사용하기 전에 충분한 테스트와 검증이 필요합니다.
- 암호화폐 투자는 높은 위험을 수반하므로 신중하게 결정하세요.
