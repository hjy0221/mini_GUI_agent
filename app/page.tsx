'use client';

import { useState, useEffect, useRef } from 'react';
import { runGuiAgent, LogBlock } from '@/lib/agent-runner';

/**
 * ✦ mini-GUI-agent Dashboard
 * 현대적이고 미려한 디자인의 AI 에이전트 인터페이스입니다.
 */
export default function AgentDashboard() {
  const [goal, setGoal] = useState('');
  const [logs, setLogs] = useState<LogBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mockMode, setMockMode] = useState(true);
  const [modelType, setModelType] = useState<'claude' | 'gemini'>('claude');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!goal.trim() || isLoading) return;

    setIsLoading(true);
    // 로그 초기화 및 시작 메시지
    setLogs([{ type: 'thought', content: `"${goal}" 작업을 시작합니다...` }]);

    try {
      const response = await runGuiAgent(goal, mockMode, modelType);
      if (response.success) {
        setLogs(prev => [...prev, ...response.logs]);
      } else {
        setLogs(prev => [...prev, { type: 'error', content: '에이전트 실행 중 오류가 발생했습니다.' }]);
      }
    } catch (err) {
      setLogs(prev => [...prev, { type: 'error', content: `클라이언트 오류: ${String(err)}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="dashboard-container">
      {/* 1. Explorer Panel */}
      <section className="panel explorer animate-in">
        <header className="panel-header">
          <h2>Explorer</h2>
          <span>📁</span>
        </header>
        <div style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <p style={{ marginBottom: '0.5rem' }}>✓ src/agent</p>
          <p style={{ marginBottom: '0.5rem' }}>✓ src/tools</p>
          <p style={{ marginBottom: '0.5rem' }}>✓ src/executor</p>
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>System Active</p>
            <p style={{ fontSize: '0.7rem' }}>mini-gui-agent v2.0.0</p>
          </div>
        </div>
      </section>

      {/* 2. Main Agent Workspace */}
      <section className="panel animate-in" style={{ animationDelay: '0.1s' }}>
        <header className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 10, height: 10, background: isLoading ? '#fbbf24' : '#34d399', borderRadius: '50%', boxShadow: '0 0 10px rgba(52,211,153,0.5)' }}></div>
            <h2>Claude Agent Loop</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setMockMode(!mockMode)}
              style={{ 
                background: mockMode ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                border: '1px solid var(--accent-primary)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '2rem',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              Mock: {mockMode ? 'ON' : 'OFF'}
            </button>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '2rem' }}>
              <button 
                onClick={() => setModelType('claude')}
                style={{ 
                  background: modelType === 'claude' ? 'var(--accent-primary)' : 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.65rem',
                  cursor: 'pointer'
                }}
              >
                Claude
              </button>
              <button 
                onClick={() => setModelType('gemini')}
                style={{ 
                  background: modelType === 'gemini' ? 'var(--accent-secondary)' : 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.65rem',
                  cursor: 'pointer'
                }}
              >
                Gemini
              </button>
            </div>
          </div>
        </header>

        <div className="chat-container" ref={scrollRef}>
          {logs.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-primary)', opacity: 0.5 }}>✦</h1>
              <p>에이전트에게 작업을 지시해 주세요.</p>
            </div>
          )}
          
          {logs.map((log, index) => (
            <div key={index} className={`message ${log.type === 'thought' ? 'assistant-message' : ''} animate-in`}>
              {log.type === 'thought' && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>AGENT BRAIN</span>
                  <p>{log.content}</p>
                </div>
              )}

              {log.type === 'tool_use' && (
                <div className="tool-log">
                  <p>🔧 EXECUTE: <strong>{log.content}</strong></p>
                  {log.detail && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>INPUT: {log.detail}</p>}
                </div>
              )}

              {log.type === 'tool_result' && (
                <div style={{ padding: '0.5rem 0', color: log.success ? 'var(--success-color)' : 'var(--error-color)', fontSize: '0.85rem' }}>
                  {log.success ? '✓' : '✗'} RESULT: {log.content.length > 100 ? log.content.slice(0, 100) + '...' : log.content}
                </div>
              )}

              {log.type === 'summary' && (
                <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed var(--success-color)' }}>
                  <p style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>🏁 {log.content}</p>
                </div>
              )}

              {log.type === 'error' && (
                <div style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>
                  ⚠️ {log.content}
                </div>
              )}
            </div>
          ))}
          {isLoading && <div className="message assistant-message animate-in">사고하는 중...</div>}
        </div>

        <form className="input-area" onSubmit={handleSubmit}>
          <input 
            type="text" 
            className="modern-input" 
            placeholder="어떤 작업을 도와드릴까요?" 
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="send-btn" disabled={isLoading}>
            {isLoading ? '...' : 'SEND'}
          </button>
        </form>
      </section>

      {/* 3. Analytics / Metrics */}
      <section className="panel animate-in" style={{ animationDelay: '0.2s' }}>
        <header className="panel-header">
          <h2>Metrics</h2>
          <span>📊</span>
        </header>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ITERATION PROGRESS</p>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: '0.5rem' }}>
              <div style={{ width: isLoading ? '60%' : '100%', height: '100%', background: 'var(--accent-primary)', borderRadius: 2, transition: 'width 0.5s' }}></div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem' }}>{logs.filter(l => l.type === 'tool_use').length}</h3>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOOLS USED</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem' }}>{isLoading ? '...' : 'Done'}</h3>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STATUS</p>
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(96, 165, 250, 0.1))', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>에이전트는 <strong>{modelType === 'claude' ? 'Claude 3.5 Sonnet' : 'Gemini 1.5 Pro'}</strong> 모델을 사용하여 실시간으로 프로젝트 코드를 분석하고 해결책을 제시합니다.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
