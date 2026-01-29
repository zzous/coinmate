# Supabase 프로젝트 설정 가이드

## 1단계: Supabase 계정 생성 및 프로젝트 생성

### 1.1 Supabase 계정 생성
1. [Supabase 웹사이트](https://supabase.com) 접속
2. "Start your project" 또는 "Sign up" 클릭
3. GitHub 계정으로 로그인하거나 이메일로 회원가입

### 1.2 새 프로젝트 생성
1. 대시보드에서 "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `coinmate` (원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (나중에 필요)
   - **Region**: 가장 가까운 지역 선택 (예: Northeast Asia (Seoul))
   - **Pricing Plan**: Free tier 선택 (개발용)
3. "Create new project" 클릭
4. 프로젝트 생성 완료까지 1-2분 대기

## 2단계: API 키 및 URL 확인

### 2.1 프로젝트 설정에서 정보 확인
1. 프로젝트 대시보드에서 왼쪽 사이드바의 **Settings** (⚙️) 클릭
2. **API** 메뉴 선택
3. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co` 형식
   - **anon public** 키: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식

## 3단계: 환경 변수 설정

### 3.1 .env.local 파일 생성
프로젝트 루트 디렉토리에 `.env.local` 파일을 생성합니다:

```bash
# Windows (Git Bash)
touch .env.local

# 또는 직접 파일 생성
```

### 3.2 환경 변수 추가
`.env.local` 파일에 다음 내용을 추가:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI API 설정 (선택사항)
OPENAI_API_KEY=your_openai_api_key

# 거래소 API 설정 (향후 사용)
# UPBIT_ACCESS_KEY=your_upbit_access_key
# UPBIT_SECRET_KEY=your_upbit_secret_key
```

**⚠️ 중요**: 
- `xxxxx` 부분을 실제 프로젝트 URL로 교체
- `eyJhbGci...` 부분을 실제 anon public 키로 교체
- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함되어 있어야 함)

## 4단계: 인증 설정 (선택사항)

### 4.1 이메일 인증 설정
1. Supabase 대시보드에서 **Authentication** → **Settings** 이동
2. **Email Auth** 섹션에서:
   - **Enable Email Signup**: 활성화
   - **Confirm email**: 개발 중에는 비활성화 가능 (즉시 로그인 가능)
   - **Secure email change**: 활성화 권장

### 4.2 이메일 템플릿 커스터마이징 (선택사항)
- **Authentication** → **Email Templates**에서 이메일 템플릿 수정 가능

## 5단계: 데이터베이스 테이블 생성 (향후 사용)

### 5.1 SQL Editor 사용
1. Supabase 대시보드에서 **SQL Editor** 클릭
2. 다음 SQL을 실행하여 전략 테이블 생성:

```sql
-- 전략 테이블
CREATE TABLE strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_symbol TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  target_price NUMERIC,
  stop_loss_price NUMERIC,
  profit_percentage NUMERIC,
  loss_percentage NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) 활성화
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 전략만 조회/수정/삭제 가능
CREATE POLICY "Users can view own strategies"
  ON strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies"
  ON strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies"
  ON strategies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies"
  ON strategies FOR DELETE
  USING (auth.uid() = user_id);
```

## 6단계: 테스트

### 6.1 개발 서버 재시작
환경 변수를 추가한 후 개발 서버를 재시작해야 합니다:

```bash
# 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
```

### 6.2 로그인 테스트
1. 브라우저에서 `http://localhost:3000` 접속
2. 로그인 폼이 표시되는지 확인
3. "회원가입" 클릭하여 새 계정 생성
4. 이메일과 비밀번호 입력 후 회원가입
5. 로그인 성공 시 메인 페이지로 이동하는지 확인

## 문제 해결

### 환경 변수가 인식되지 않는 경우
- 개발 서버를 완전히 종료하고 재시작
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 파일 이름이 정확한지 확인 (`.env.local`)

### 로그인 오류
- Supabase 프로젝트 URL과 키가 정확한지 확인
- Supabase 대시보드에서 Authentication이 활성화되어 있는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 이메일 확인이 필요한 경우
- Supabase 대시보드 → Authentication → Settings
- "Confirm email" 설정 확인
- 개발 중에는 비활성화하여 즉시 로그인 가능하게 설정

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

