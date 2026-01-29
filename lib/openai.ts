import OpenAI from 'openai';
import { AISignal } from '@/types';

// OpenAI 클라이언트 초기화
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OPENAI_API_KEY가 설정되지 않았습니다. 모의 데이터를 사용합니다.');
    return null;
  }

  return new OpenAI({
    apiKey: apiKey,
  });
}

/**
 * 기술적 지표와 시장 데이터를 기반으로 AI 신호 생성
 * API 키가 없으면 null을 반환 (에러를 throw하지 않음)
 */
export async function generateAISignalWithOpenAI(
  coinSymbol: string,
  currentPrice: number,
  technicalSummary: string,
  priceChange24h: number,
  volume24h: number
): Promise<AISignal | null> {
  const client = getOpenAIClient();

  if (!client) {
    // API 키가 없으면 null 반환 (에러를 throw하지 않음)
    return null;
  }

  const prompt = `당신은 암호화폐 시장 분석 전문가입니다. 다음 정보를 바탕으로 매수/매도/보유 신호를 생성해주세요.

코인: ${coinSymbol}
현재가: ${currentPrice.toLocaleString()}원
24시간 변동률: ${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%
24시간 거래량: ${volume24h.toLocaleString()}원

기술적 지표:
${technicalSummary}

다음 JSON 형식으로 응답해주세요:
{
  "signal": "buy" | "sell" | "hold",
  "confidence": 0.0-1.0 사이의 숫자,
  "reasoning": "한국어로 상세한 분석 근거를 설명해주세요. 기술적 지표, 시장 상황, 리스크 등을 종합적으로 고려하여 작성해주세요."
}

응답은 반드시 유효한 JSON 형식이어야 하며, 다른 텍스트는 포함하지 마세요.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini', // 비용 효율적인 모델 사용 (gpt-4o로 변경 가능)
      messages: [
        {
          role: 'system',
          content: '당신은 암호화폐 시장 분석 전문가입니다. 기술적 지표와 시장 데이터를 종합적으로 분석하여 투자 신호를 제공합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('OpenAI 응답이 비어있습니다');
    }

    const parsed = JSON.parse(responseContent);

    // 신호 유효성 검증
    if (!['buy', 'sell', 'hold'].includes(parsed.signal)) {
      throw new Error('유효하지 않은 신호 타입');
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('유효하지 않은 신뢰도 값');
    }

    return {
      coinSymbol,
      signal: parsed.signal,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning || '분석 완료',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    throw error;
  }
}

