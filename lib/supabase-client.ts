import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 싱글톤 Supabase 클라이언트 인스턴스
let supabaseClientInstance: SupabaseClient | null = null;

// 클라이언트 컴포넌트용 Supabase 클라이언트 (싱글톤)
export function createSupabaseClient(): SupabaseClient {
  // 이미 인스턴스가 있으면 재사용
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // URL 변경 시 이벤트 발생 방지
    },
  });

  return supabaseClientInstance;
}

// 서버 컴포넌트용 Supabase 클라이언트 (기존 방식 유지)
export const supabase = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseAnonKey);
})();

