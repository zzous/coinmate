'use client';

import { AISignal } from '@/types';

interface AISignalDisplayProps {
  signal: AISignal;
}

export default function AISignalDisplay({ signal }: AISignalDisplayProps) {
  const getSignalColor = () => {
    switch (signal.signal) {
      case 'sell':
        return 'var(--danger)';
      case 'buy':
        return 'var(--success)';
      case 'hold':
        return 'var(--warning)';
      default:
        return 'var(--secondary)';
    }
  };

  const getSignalLabel = () => {
    switch (signal.signal) {
      case 'sell':
        return '매도';
      case 'buy':
        return '매수';
      case 'hold':
        return '보유';
      default:
        return signal.signal;
    }
  };

  const getConfidenceLevel = () => {
    const percent = signal.confidence * 100;
    if (percent >= 80) return { label: '매우 높음', color: 'var(--success)' };
    if (percent >= 60) return { label: '높음', color: 'var(--primary)' };
    if (percent >= 40) return { label: '보통', color: 'var(--warning)' };
    return { label: '낮음', color: 'var(--secondary)' };
  };

  const confidenceLevel = getConfidenceLevel();

  // reasoning을 구조화된 섹션으로 파싱하고 지표 추출
  const parseReasoning = (text: string) => {
    const sections: { title: string; content: string[]; indicators?: Array<{ name: string; value: string; status: string; statusColor: string }> }[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentSection: { title: string; content: string[]; indicators?: Array<{ name: string; value: string; status: string; statusColor: string }> } | null = null;
    
    // 지표 추출 헬퍼 함수
    const extractIndicator = (line: string) => {
      // RSI: 65.5 (과매수) 형식
      const rsiMatch = line.match(/RSI:\s*([\d.]+)\s*\(([^)]+)\)/);
      if (rsiMatch) {
        const value = parseFloat(rsiMatch[1]);
        const status = rsiMatch[2];
        return {
          name: 'RSI',
          value: value.toFixed(1),
          status,
          statusColor: value > 70 ? 'var(--danger)' : value < 30 ? 'var(--success)' : 'var(--warning)'
        };
      }
      
      // Stochastic: %K=75.2, %D=72.1 (과매수) 형식
      const stochMatch = line.match(/Stochastic:\s*%K=([\d.]+),\s*%D=([\d.]+)\s*\(([^)]+)\)/);
      if (stochMatch) {
        const k = parseFloat(stochMatch[1]);
        const status = stochMatch[3];
        return {
          name: 'Stochastic',
          value: `%K: ${k.toFixed(1)}, %D: ${stochMatch[2]}`,
          status,
          statusColor: k > 80 ? 'var(--danger)' : k < 20 ? 'var(--success)' : 'var(--warning)'
        };
      }
      
      // Williams %R: -25.5 (과매수) 형식
      const williamsMatch = line.match(/Williams\s*%R:\s*([-\d.]+)\s*\(([^)]+)\)/);
      if (williamsMatch) {
        const value = parseFloat(williamsMatch[1]);
        const status = williamsMatch[2];
        return {
          name: 'Williams %R',
          value: value.toFixed(1),
          status,
          statusColor: value > -20 ? 'var(--danger)' : value < -80 ? 'var(--success)' : 'var(--warning)'
        };
      }
      
      // CCI: 125.3 (과매수) 형식
      const cciMatch = line.match(/CCI:\s*([-\d.]+)\s*\(([^)]+)\)/);
      if (cciMatch) {
        const value = parseFloat(cciMatch[1]);
        const status = cciMatch[2];
        return {
          name: 'CCI',
          value: value.toFixed(1),
          status,
          statusColor: value > 100 ? 'var(--danger)' : value < -100 ? 'var(--success)' : 'var(--warning)'
        };
      }
      
      // 이동평균: MA20=50000, MA50=48000, MA200=45000 형식
      const maMatch = line.match(/이동평균:\s*MA20=([\d,]+),\s*MA50=([\d,]+),\s*MA200=([\d,]+)/);
      if (maMatch) {
        return {
          name: '이동평균선',
          value: `MA20: ${maMatch[1]}, MA50: ${maMatch[2]}, MA200: ${maMatch[3]}`,
          status: '',
          statusColor: 'var(--primary)'
        };
      }
      
      // ADX: 28.5 (강한 추세) 형식
      const adxMatch = line.match(/ADX:\s*([\d.]+)\s*\(([^)]+)\)/);
      if (adxMatch) {
        const value = parseFloat(adxMatch[1]);
        const status = adxMatch[2];
        return {
          name: 'ADX',
          value: value.toFixed(1),
          status,
          statusColor: value > 25 ? 'var(--success)' : value > 20 ? 'var(--warning)' : 'var(--secondary)'
        };
      }
      
      // MACD: 125.3, Signal: 120.5, Histogram: 4.8 (상승 신호) 형식
      const macdMatch = line.match(/MACD:\s*([-\d.]+),\s*Signal:\s*([-\d.]+),\s*Histogram:\s*([-\d.]+)\s*\(([^)]+)\)/);
      if (macdMatch) {
        const histogram = parseFloat(macdMatch[3]);
        const status = macdMatch[4];
        return {
          name: 'MACD',
          value: `MACD: ${macdMatch[1]}, Signal: ${macdMatch[2]}, Histogram: ${macdMatch[3]}`,
          status,
          statusColor: histogram > 0 ? 'var(--success)' : 'var(--danger)'
        };
      }
      
      // 볼린저 밴드: 상단 위치 (상단: 55000, 하단: 45000) 형식
      const bbMatch = line.match(/볼린저\s*밴드:\s*([가-힣]+)\s*위치\s*\(상단:\s*([\d,]+),\s*하단:\s*([\d,]+)\)/);
      if (bbMatch) {
        return {
          name: '볼린저 밴드',
          value: `상단: ${bbMatch[2]}, 하단: ${bbMatch[3]}`,
          status: bbMatch[1] + ' 위치',
          statusColor: bbMatch[1] === '상단' ? 'var(--danger)' : bbMatch[1] === '하단' ? 'var(--success)' : 'var(--warning)'
        };
      }
      
      // 지지선: 45000원 형식
      const supportMatch = line.match(/지지선:\s*([\d,]+)원/);
      if (supportMatch) {
        return {
          name: '지지선',
          value: supportMatch[1] + '원',
          status: '',
          statusColor: 'var(--success)'
        };
      }
      
      // 저항선: 55000원 형식
      const resistanceMatch = line.match(/저항선:\s*([\d,]+)원/);
      if (resistanceMatch) {
        return {
          name: '저항선',
          value: resistanceMatch[1] + '원',
          status: '',
          statusColor: 'var(--danger)'
        };
      }
      
      // ATR: 2500원 형식
      const atrMatch = line.match(/ATR:\s*([\d,]+)원/);
      if (atrMatch) {
        return {
          name: 'ATR (변동성)',
          value: atrMatch[1] + '원',
          status: '',
          statusColor: 'var(--primary)'
        };
      }
      
      // 현재가: 50000원 형식
      const priceMatch = line.match(/현재가:\s*([\d,]+)원/);
      if (priceMatch) {
        return {
          name: '현재가',
          value: priceMatch[1] + '원',
          status: '',
          statusColor: 'var(--primary)'
        };
      }
      
      return null;
    };
    
    for (const line of lines) {
      // 섹션 제목 감지 (이모지나 특수 문자로 시작)
      if (line.match(/^[📊📈💹📉📊]/) || line.match(/^[A-Z가-힣\s]+:$/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^[📊📈💹📉📊]\s*/, '').replace(':', ''),
          content: [],
          indicators: []
        };
      } else if (currentSection) {
        // 지표 추출 시도
        const indicator = extractIndicator(line);
        if (indicator) {
          if (!currentSection.indicators) {
            currentSection.indicators = [];
          }
          currentSection.indicators.push(indicator);
        }
        currentSection.content.push(line);
      } else {
        // 첫 번째 섹션이 없으면 기본 섹션 생성
        if (sections.length === 0) {
          sections.push({ title: '분석 요약', content: [], indicators: [] });
        }
        const indicator = extractIndicator(line);
        if (indicator && sections[0].indicators) {
          sections[0].indicators.push(indicator);
        }
        sections[0].content.push(line);
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections.length > 0 ? sections : [{ title: '분석 내용', content: [text], indicators: [] }];
  };

  const reasoningSections = parseReasoning(signal.reasoning);

  return (
    <div className="card">
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>
            AI 분석 신호 - {signal.coinSymbol}
          </h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
            {new Date(signal.timestamp).toLocaleString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
        <div
          className="badge"
          style={{
            background: `${getSignalColor()}20`,
            color: getSignalColor(),
            fontSize: '1.1rem',
            fontWeight: '600',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.5rem',
            border: `2px solid ${getSignalColor()}`,
          }}
        >
          {getSignalLabel()}
        </div>
      </div>

      {/* 신뢰도 섹션 */}
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>신뢰도</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: confidenceLevel.color, marginTop: '0.25rem' }}>
              {(signal.confidence * 100).toFixed(1)}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>신뢰도 수준</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: confidenceLevel.color }}>
              {confidenceLevel.label}
            </div>
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: '12px',
            background: 'var(--border)',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${signal.confidence * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getSignalColor()}, ${confidenceLevel.color})`,
              transition: 'width 0.5s ease',
              borderRadius: '9999px',
            }}
          />
        </div>
      </div>

      {/* 신호 설명 */}
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: `${getSignalColor()}10`, borderRadius: '0.5rem', border: `1px solid ${getSignalColor()}40` }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: getSignalColor(), marginBottom: '0.5rem' }}>
          신호 의미
        </div>
        <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--foreground)' }}>
          {signal.signal === 'sell' && '현재 시점에서 매도하는 것이 유리할 수 있습니다. 기술적 지표와 AI 분석을 종합적으로 고려한 결과입니다.'}
          {signal.signal === 'buy' && '현재 시점에서 매수하는 것이 유리할 수 있습니다. 기술적 지표와 AI 분석을 종합적으로 고려한 결과입니다.'}
          {signal.signal === 'hold' && '현재 시점에서 보유하는 것이 유리할 수 있습니다. 추가적인 시장 변화를 관찰하는 것이 좋습니다.'}
        </div>
      </div>

      {/* 분석 근거 섹션 */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--foreground)' }}>
          📊 상세 분석 근거
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reasoningSections.map((section, index) => (
            <div
              key={index}
              style={{
                padding: '1.25rem',
                background: 'var(--background)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '1rem', 
                color: 'var(--primary)',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid var(--border)'
              }}>
                {section.title}
              </div>
              
              {/* 지표 카드 그리드 */}
              {section.indicators && section.indicators.length > 0 && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  {section.indicators.map((indicator, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.875rem',
                        background: `${indicator.statusColor}10`,
                        borderRadius: '0.5rem',
                        border: `1px solid ${indicator.statusColor}30`,
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--secondary)', 
                        marginBottom: '0.25rem',
                        fontWeight: '500'
                      }}>
                        {indicator.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '600', 
                        color: 'var(--foreground)',
                        marginBottom: '0.25rem',
                        wordBreak: 'break-word'
                      }}>
                        {indicator.value}
                      </div>
                      {indicator.status && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: indicator.statusColor,
                          fontWeight: '600',
                          marginTop: '0.25rem'
                        }}>
                          {indicator.status}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 텍스트 내용 */}
              <div style={{ fontSize: '0.875rem', lineHeight: '1.8', color: 'var(--foreground)' }}>
                {section.content.map((line, lineIndex) => {
                  // 이미 지표로 추출된 라인은 스킵
                  const isIndicatorLine = section.indicators?.some(ind => 
                    line.includes(ind.name) || 
                    (ind.name === 'RSI' && line.includes('RSI:')) ||
                    (ind.name === 'Stochastic' && line.includes('Stochastic:')) ||
                    (ind.name === 'Williams %R' && line.includes('Williams')) ||
                    (ind.name === 'CCI' && line.includes('CCI:')) ||
                    (ind.name === '이동평균선' && line.includes('이동평균:')) ||
                    (ind.name === 'ADX' && line.includes('ADX:')) ||
                    (ind.name === 'MACD' && line.includes('MACD:')) ||
                    (ind.name === '볼린저 밴드' && line.includes('볼린저')) ||
                    (ind.name === '지지선' && line.includes('지지선:')) ||
                    (ind.name === '저항선' && line.includes('저항선:')) ||
                    (ind.name === 'ATR' && line.includes('ATR:')) ||
                    (ind.name === '현재가' && line.includes('현재가:'))
                  );
                  
                  if (isIndicatorLine) return null;
                  
                  return (
                    <div key={lineIndex} style={{ marginBottom: lineIndex < section.content.length - 1 ? '0.5rem' : '0' }}>
                      {line.startsWith('-') ? (
                        <div style={{ paddingLeft: '1rem', position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.5rem', color: 'var(--primary)' }}>•</span>
                          <span style={{ paddingLeft: '0.5rem' }}>{line.substring(1).trim()}</span>
                        </div>
                      ) : (
                        <div>{line}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 정보 */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--secondary)', textAlign: 'center' }}>
        ⚠️ 이 분석은 참고용이며, 투자 결정에 대한 책임은 본인에게 있습니다.
      </div>
    </div>
  );
}

