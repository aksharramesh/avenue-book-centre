'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Play, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Server, 
  ShieldAlert, 
  Activity, 
  FileText,
  Percent,
  ShoppingCart,
  Boxes,
  Compass
} from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

interface TestSection {
  title: string;
  icon: any;
  tests: TestResult[];
}

export default function DiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestSection[] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startSuite = async () => {
    setIsRunning(true);
    setResults(null);
    setLogs([]);
    setError(null);
    addLog("Initializing Avenue Book Centre E2E Diagnostic Suite...");

    try {
      // We will perform the server-side diagnostics via an API route or a server action fetch.
      // Since Server Actions can be executed from client component directly, we fetch /api/diagnose
      addLog("Sending diagnostics payload to Next.js server context...");
      
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        addLog(`❌ Diagnostics aborted: ${data.error}`);
      } else {
        setResults(data.sections);
        setLogs(prev => [...prev, ...data.logs]);
        addLog("✨ Diagnostic suite run completed successfully. Review results below.");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to communicate with diagnostic endpoint.");
      addLog(`❌ Diagnostics failed to run: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-primary)', fontWeight: 700 }}>
            Operational Health & Testing
          </span>
          <h1 style={{ fontSize: '2.25rem', margin: '0.25rem 0 0 0', fontWeight: 800 }}>
            System Diagnostics & E2E Tests
          </h1>
        </div>
        <Link href="/admin/products" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
          Back to Catalog
        </Link>
      </div>

      {/* Main Console Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Diagnostics Report */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Welcome Dashboard Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.08, color: '#ffffff' }}>
              <Server size={220} />
            </div>
            <div style={{ maxWidth: '600px', position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ffffff' }}>
                End-to-End Core Feature Automation
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                This diagnostics suite programmatically tests all system features of the Avenue Book Centre platform. It verifies database integrity, single/bulk product updates, category tree structures, discount codes, checkout tax & shipping cost math, order processing, and administrative permission guards.
              </p>
              
              <button 
                onClick={startSuite} 
                disabled={isRunning}
                style={{
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'opacity 0.2s',
                  boxShadow: '0 4px 12px var(--brand-glow)'
                }}
              >
                {isRunning ? (
                  <>
                    <RotateCw size={18} className="animate-spin" /> Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Play size={18} /> Run Diagnostics Suite
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Category Sections */}
          {results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {results.map((section, idx) => {
                const totalPassed = section.tests.filter(t => t.passed).length;
                const totalTests = section.tests.length;
                const allPassed = totalPassed === totalTests;

                return (
                  <div key={idx} style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.01)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        {section.title}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        background: allPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: allPassed ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {totalPassed} / {totalTests} PASSED
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {section.tests.map((test, tIdx) => (
                        <div key={tIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          {test.passed ? (
                            <CheckCircle2 size={18} color="var(--success)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                          ) : (
                            <XCircle size={18} color="var(--danger)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {test.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {test.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid var(--danger)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: 'var(--danger)'
            }}>
              <ShieldAlert size={28} />
              <div>
                <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>Diagnostics Error</strong>
                <span style={{ fontSize: '0.875rem' }}>{error}</span>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Console Output Logs */}
        <div style={{
          background: '#0f172a',
          color: '#38bdf8',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          border: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <Terminal size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Telemetry Console
            </span>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingRight: '0.5rem',
            color: '#e2e8f0'
          }}>
            {logs.length === 0 ? (
              <span style={{ color: '#64748b', fontStyle: 'italic' }}>Console idle. Awaiting diagnostic run...</span>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} style={{
                  wordBreak: 'break-all',
                  color: log.includes('❌') ? '#ef4444' : log.includes('✅') || log.includes('✨') ? '#10b981' : '#e2e8f0'
                }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
