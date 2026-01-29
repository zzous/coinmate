'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'signin' | 'signup' | 'reset';

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { signIn, signUp, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          setLoading(false);
        } else {
          // 로그인 성공 시 페이지 새로고침하여 리다이렉트
          // window.location을 사용하여 모든 상태 초기화
          const next = searchParams.get('next') || '/';
          const targetUrl = next.startsWith('http') ? next : window.location.origin + next;
          window.location.replace(targetUrl);
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('비밀번호는 최소 6자 이상이어야 합니다.');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setMessage('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        }
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setMessage('비밀번호 재설정 이메일을 발송했습니다.');
        }
      }
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center' }}>
        {mode === 'signin' && '로그인'}
        {mode === 'signup' && '회원가입'}
        {mode === 'reset' && '비밀번호 재설정'}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              fontSize: '1rem',
            }}
            placeholder="your@email.com"
          />
        </div>

        {mode !== 'reset' && (
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
              }}
              placeholder="비밀번호 (최소 6자)"
            />
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
              }}
              placeholder="비밀번호 확인"
            />
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--danger)20',
              color: 'var(--danger)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--success)20',
              color: 'var(--success)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: loading ? 'var(--secondary)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? '처리 중...' : mode === 'signin' ? '로그인' : mode === 'signup' ? '회원가입' : '이메일 발송'}
        </button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
        {mode === 'signin' && (
          <>
            <button
              onClick={() => setMode('signup')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              회원가입
            </button>
            {' | '}
            <button
              onClick={() => setMode('reset')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              비밀번호 찾기
            </button>
          </>
        )}
        {mode === 'signup' && (
          <button
            onClick={() => setMode('signin')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            이미 계정이 있으신가요? 로그인
          </button>
        )}
        {mode === 'reset' && (
          <button
            onClick={() => setMode('signin')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            로그인으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}

