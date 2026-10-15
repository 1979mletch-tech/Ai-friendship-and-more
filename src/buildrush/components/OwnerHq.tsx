// Private BuildRush HQ — One-Page Owner Control Centre
// Route: /owner (or https://thebuildrush.com/owner)
// Enforces server-side owner role verification, deny-by-default, and audit logging.

import React, { useEffect, useState } from 'react'
import { OwnerAiService } from '../services/ownerAiService'
import type { OwnerDashboardMetrics } from '../services/ownerAiService'
import { CoreBrainService } from '../services/coreBrainService'
import type {
  SensitiveActionProposal,
  OwnerAuditLog,
  CoreKnowledgeItem,
} from '../types'
import './ownerHq.css'

interface OwnerHqProps {
  authToken?: string
}

const formatMetric = (value: number | null | undefined) =>
  value == null ? 'Not available' : value.toLocaleString('en-GB')

export const OwnerHq: React.FC<OwnerHqProps> = ({
  authToken = '',
}) => {
  const [ownerAi] = useState(() => new OwnerAiService())
  const [coreBrain] = useState(() => CoreBrainService.getInstance())
  const [accessResult, setAccessResult] = useState<{
    token: string
    status: 'ready' | 'forbidden' | 'unavailable'
    metrics: OwnerDashboardMetrics | null
  } | null>(null)
  const accessState = !authToken
    ? 'signed-out'
    : accessResult?.token !== authToken
      ? 'loading'
      : accessResult.status
  const metrics = accessResult?.token === authToken ? accessResult.metrics : null

  const [chatMessages, setChatMessages] = useState(ownerAi.getMessages())
  const [chatInput, setChatInput] = useState('')
  const [isAiBusy, setIsAiBusy] = useState(false)
  const [activeProposal, setActiveProposal] = useState<SensitiveActionProposal | null>(null)
  const [proposalStatus, setProposalStatus] = useState<string>('')

  const [activeTab, setActiveTab] = useState<'chat' | 'brain' | 'archives' | 'audit'>('chat')
  const [auditLogs, setAuditLogs] = useState<OwnerAuditLog[]>([])

  useEffect(() => {
    if (!authToken) return

    let active = true
    ownerAi.getDashboard(authToken).then((data) => {
      if (!active) return
      setAccessResult({ token: authToken, status: 'ready', metrics: data })
    }).catch((error: unknown) => {
      if (!active) return
      setAccessResult({
        token: authToken,
        status: error instanceof Error && /forbidden/i.test(error.message) ? 'forbidden' : 'unavailable',
        metrics: null,
      })
    })

    return () => {
      active = false
    }
  }, [authToken, ownerAi])

  if (accessState !== 'ready') {
    return (
      <main className="br-access-denied" role="alert">
        <h1 style={{ color: '#b91c1c', fontSize: '1.5rem', marginBottom: '12px' }}>
          {accessState === 'loading' ? 'Checking private owner access…' :
            accessState === 'signed-out' ? 'Sign in to access BuildRush HQ' :
              accessState === 'forbidden' ? '403 Forbidden — Private Owner HQ' : 'Owner HQ data unavailable'}
        </h1>
        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {accessState === 'signed-out'
            ? <>This is private. <a href="#/account">Sign in</a> and return to the owner page.</>
            : accessState === 'loading'
              ? 'The server is verifying your owner permissions.'
              : accessState === 'forbidden'
                ? 'The server did not authorize this account for owner access.'
                : 'The server could not verify owner access or load authorised business data. Try again later.'}
        </p>
      </main>
    )
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isAiBusy) return

    const messageText = chatInput.trim()
    setChatInput('')
    setIsAiBusy(true)

    try {
      const response = await ownerAi.sendOwnerMessage(messageText, authToken)
      setChatMessages(ownerAi.getMessages())
      if (response.proposal) {
        setActiveProposal(response.proposal)
        setProposalStatus('')
      }
    } catch {
      setChatMessages(ownerAi.getMessages())
    } finally {
      setIsAiBusy(false)
    }
  }

  const handleLogProposal = async () => {
    if (!activeProposal) return
    setProposalStatus('Recording the confirmed proposal. No business action will be executed.')

    try {
      const result = await ownerAi.confirmAndLogProposal(activeProposal, authToken)
      setProposalStatus(result.message)

      // Add the confirmed proposal to the local audit log view.
      const newLog: OwnerAuditLog = {
        id: 'log-' + Date.now(),
        ownerId: 'owner-session',
        action: activeProposal.actionType,
        targetType: activeProposal.targetType || 'unknown',
        targetId: activeProposal.targetId || 'unknown',
        details: activeProposal.payload || {},
        confirmedByOwner: true,
        createdAt: new Date().toISOString(),
      }
      setAuditLogs((prev) => [newLog, ...prev])
      setActiveProposal(null)
    } catch (err: unknown) {
      setProposalStatus(err instanceof Error ? err.message : 'Action execution failed')
    }
  }

  return (
    <div className="br-owner-hq" role="main">
      {/* Header */}
      <header className="br-hq-header">
        <div className="br-hq-title">
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#101b2b' }}>
            BuildRush <span style={{ color: '#ff7139' }}>HQ</span>
          </span>
          <span className="br-hq-badge">Owner Control Centre</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`br-btn-primary ${activeTab === 'chat' ? '' : 'secondary'}`}
            style={{ background: activeTab === 'chat' ? '#101b2b' : '#e2e8f0', color: activeTab === 'chat' ? '#fff' : '#101b2b' }}
            onClick={() => setActiveTab('chat')}
          >
            Owner AI Panel
          </button>
          <button
            className={`br-btn-primary ${activeTab === 'brain' ? '' : 'secondary'}`}
            style={{ background: activeTab === 'brain' ? '#101b2b' : '#e2e8f0', color: activeTab === 'brain' ? '#fff' : '#101b2b' }}
            onClick={() => setActiveTab('brain')}
          >
            Core Brain (Layer 1)
          </button>
          <button
            className={`br-btn-primary ${activeTab === 'archives' ? '' : 'secondary'}`}
            style={{ background: activeTab === 'archives' ? '#101b2b' : '#e2e8f0', color: activeTab === 'archives' ? '#fff' : '#101b2b' }}
            onClick={() => setActiveTab('archives')}
          >
            Monthly Archives
          </button>
          <button
            className={`br-btn-primary ${activeTab === 'audit' ? '' : 'secondary'}`}
            style={{ background: activeTab === 'audit' ? '#101b2b' : '#e2e8f0', color: activeTab === 'audit' ? '#fff' : '#101b2b' }}
            onClick={() => setActiveTab('audit')}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>
      </header>

      {/* Operational Dashboard Metrics Grid */}
      <section className="br-hq-grid" aria-label="Operational Metrics">
        <div className="br-hq-stat-card">
          <div className="br-hq-stat-label">Jobs Needing Attention</div>
          <div className="br-hq-stat-value highlight">Not tracked</div>
        </div>
        <div className="br-hq-stat-card">
          <div className="br-hq-stat-label">Open / Completed Jobs</div>
          <div className="br-hq-stat-value">{formatMetric(metrics?.openJobsCount)} / {formatMetric(metrics?.completedJobsCount)}</div>
        </div>
        <div className="br-hq-stat-card">
          <div className="br-hq-stat-label">Active Tradespeople</div>
          <div className="br-hq-stat-value">{formatMetric(metrics?.totalTradespeople)}</div>
        </div>
        <div className="br-hq-stat-card">
          <div className="br-hq-stat-label">Stripe Monthly Volume</div>
          <div className="br-hq-stat-value">{metrics?.stripeMonthlyRevenueGbp == null ? 'Not available' : `£${formatMetric(metrics.stripeMonthlyRevenueGbp)}`}</div>
        </div>
        <div className="br-hq-stat-card">
          <div className="br-hq-stat-label">Customer AI / Owner AI</div>
          <div className="br-hq-stat-value" style={{ fontSize: '1.1rem', paddingTop: '6px' }}>
            <span>Not health-checked</span>
          </div>
        </div>
      </section>

      {/* Tab Panels */}
      {activeTab === 'chat' && (
        <section className="br-hq-main-panels">
          {/* Owner AI Chat Panel */}
          <div className="br-hq-panel">
            <div className="br-hq-panel-header">
              <h2 className="br-hq-panel-title">
                <img
                  src="/buildrush/owner-ai-avatar.svg"
                  alt="BuildRush HQ Advisor"
                  className="br-ai-avatar"
                  onError={(e) => {
                    // Fallback to stylized initial if SVG not yet loaded
                    (e.target as HTMLElement).style.display = 'none'
                  }}
                />
                BuildRush HQ Advisor (AI)
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Executive & Operational</span>
            </div>

            <div className="br-chat-messages" aria-live="polite">
              {chatMessages.length === 0 && (
                <div style={{ color: '#64748b', textAlign: 'center', margin: 'auto' }}>
                  Ask the HQ Advisor for operational summaries, trend analyses, or to prepare administrative proposals.
                </div>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`br-chat-bubble ${msg.role}`}>
                  <div>{msg.text}</div>
                  <div className="br-chat-meta">
                    {msg.role === 'assistant' ? 'BuildRush HQ Advisor (AI)' : 'Owner'} ·{' '}
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Proposal Confirmation Box (Strictly enforced workflow) */}
            {activeProposal && (
              <div className="br-proposal-box" role="alert">
                <div className="br-proposal-title">
                  ⚠️ Action Proposal Prepared: {activeProposal.actionType.toUpperCase()}
                </div>
                <p className="br-proposal-consequence">{activeProposal.consequences}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="br-btn-confirm" onClick={handleLogProposal}>
                    Confirm & Log Proposal
                  </button>
                  <button
                    className="br-btn-primary"
                    style={{ background: '#e2e8f0', color: '#334155', padding: '8px 14px', fontSize: '0.85rem' }}
                    onClick={() => setActiveProposal(null)}
                  >
                    Cancel Action
                  </button>
                  {proposalStatus && <span style={{ fontSize: '0.8rem', color: '#9a3412' }}>{proposalStatus}</span>}
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="br-chat-input-row" style={{ marginTop: '14px' }}>
              <input
                type="text"
                className="br-chat-input"
                placeholder="Ask about live jobs, subscription trends, or request an operational action..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiBusy}
              />
              <button type="submit" className="br-btn-primary" disabled={isAiBusy || !chatInput.trim()}>
                {isAiBusy ? 'Thinking...' : 'Send'}
              </button>
            </form>
          </div>

          {/* Side Panel: Urgent Items & Public Assistant Inspector */}
          <div className="br-hq-panel">
            <h3 style={{ marginTop: 0, fontSize: '1.05rem', color: '#101b2b' }}>Urgent Action Items</h3>
            <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: '#334155', lineHeight: '1.6' }}>
              <li>
                {metrics?.unresolvedTicketsCount == null
                  ? 'Unresolved support tickets: not available'
                  : `${formatMetric(metrics.unresolvedTicketsCount)} unresolved support tickets`}
              </li>
            </ul>

            <h3 style={{ marginTop: '20px', fontSize: '1.05rem', color: '#101b2b' }}>Public Assistant Status</h3>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Name:</strong> BuildRush Assistant (AI)</div>
              <div><strong>Tone:</strong> Friendly, grounded UK trade advisory</div>
              <div><strong>Guarantees:</strong> Prohibited (advisory only)</div>
              <div><strong>Contingency fund:</strong> Hidden / Unadvertised</div>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Core Brain (Layer 1) */}
      {activeTab === 'brain' && (
        <section className="br-hq-panel">
          <h2 className="br-hq-panel-title">Layer 1: Core Business Brain Knowledge</h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Durable business facts, operating policies, assistant identities, and pricing benchmarks.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {coreBrain.getAllActiveKnowledge().map((item: CoreKnowledgeItem) => (
              <div key={item.key} style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#ff7139' }}>{item.key}</span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Category: {item.category}</span>
                </div>
                <pre style={{ margin: 0, fontSize: '0.82rem', background: '#f8fafc', padding: '10px', borderRadius: '6px', overflowX: 'auto' }}>
                  {JSON.stringify(item.value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Monthly Archives */}
      {activeTab === 'archives' && (
        <section className="br-hq-panel">
          <h2 className="br-hq-panel-title">Monthly Working Archives</h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            End-of-month operational summaries, carried-over open cases, and key business decisions.
          </p>
          <p>Archive records are not loaded by this HQ view and have not been verified.</p>
        </section>
      )}

      {/* Tab: Audit Trail */}
      {activeTab === 'audit' && (
        <section className="br-hq-panel">
          <h2 className="br-hq-panel-title">Owner Audit Trail (Logged Sensitive Actions)</h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Owner-confirmed proposals recorded by the server; business actions are not executed here.
          </p>
          {auditLogs.length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '14px' }}>
              No sensitive actions executed during this session.
            </p>
          ) : (
            <table className="br-audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td><strong style={{ color: '#c2410c' }}>{log.action}</strong></td>
                    <td>{log.targetType}</td>
                    <td>{log.targetId}</td>
                    <td><span style={{ color: '#0f766e' }}>✓ Confirmed & Executed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  )
}
