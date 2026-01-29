# Supabase SQL Editor 쿼리 모음

## 회원 조회 쿼리

### 1. 모든 회원 조회
```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  updated_at
FROM auth.users
ORDER BY created_at DESC;
```

### 2. 특정 이메일로 회원 조회
```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'user@example.com';
```

### 3. 최근 가입한 회원 조회 (최근 10명)
```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

### 4. 이메일 인증 완료된 회원만 조회
```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
ORDER BY created_at DESC;
```

### 5. 회원 통계 조회
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as verified_users,
  COUNT(*) - COUNT(email_confirmed_at) as unverified_users
FROM auth.users;
```

### 6. 최근 로그인한 회원 조회
```sql
SELECT 
  id,
  email,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE last_sign_in_at IS NOT NULL
ORDER BY last_sign_in_at DESC
LIMIT 20;
```

### 7. 특정 기간에 가입한 회원 조회
```sql
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE created_at >= '2024-01-01'
  AND created_at < '2024-02-01'
ORDER BY created_at DESC;
```

### 8. 오늘 가입한 회원 조회
```sql
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### 9. 회원 상세 정보 조회 (모든 컬럼)
```sql
SELECT *
FROM auth.users
WHERE email = 'user@example.com';
```

### 10. 회원 수 카운트
```sql
SELECT COUNT(*) as user_count
FROM auth.users;
```

## 주의사항

1. **auth.users 테이블**: Supabase의 내부 인증 테이블입니다.
2. **보안**: 프로덕션 환경에서는 직접 조회를 제한하는 것이 좋습니다.
3. **RLS**: `auth.users` 테이블은 RLS가 적용되어 있지 않지만, 관리자 권한이 필요할 수 있습니다.

## 프로필 테이블과 조인 (profiles 테이블이 있는 경우)

```sql
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  p.full_name,
  p.avatar_url,
  p.updated_at as profile_updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

