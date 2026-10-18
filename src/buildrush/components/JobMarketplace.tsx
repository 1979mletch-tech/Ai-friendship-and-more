import { useEffect, useState, type FC, type FormEvent } from 'react';
import type { Job, TradeCategory, JobUrgency } from '../types';
import { getTradeCategoryGuidance } from '../config/pricingGuidance';
import { OwnerAiService } from '../services/ownerAiService';
import { CustomerAiChat } from './CustomerAiChat';
import './marketplace.css';

// Initial mock marketplace jobs for demonstration & testing
const INITIAL_JOBS: Job[] = [
  {
    id: 'job-101',
    customerId: 'cust-1',
    title: 'Emergency: Burst Kitchen Pipe Under Sink',
    trade: 'plumbing',
    description: 'Pipe beneath the kitchen sink has ruptured and water is leaking onto flooring. Main stopcock isolated for now. Need emergency repair today.',
    postcode: 'SW1A 1AA',
    urgency: 'today',
    budgetMin: 120,
    budgetMax: 200,
    status: 'open',
    bidCount: 2,
    createdAt: '2026-10-15T09:30:00Z',
    updatedAt: '2026-10-15T09:30:00Z',
  },
  {
    id: 'job-102',
    customerId: 'cust-2',
    title: 'Consumer Unit Tripping / Fuse Box Replacement',
    trade: 'electrical',
    description: 'Upstairs lighting circuit repeatedly trips the RCD. Need an 18th-edition certified electrician to inspect and repair or upgrade.',
    postcode: 'M1 1AE',
    urgency: 'tomorrow',
    budgetMin: 250,
    budgetMax: 450,
    status: 'open',
    bidCount: 4,
    createdAt: '2026-10-14T14:15:00Z',
    updatedAt: '2026-10-14T14:15:00Z',
  },
  {
    id: 'job-103',
    customerId: 'cust-3',
    title: 'Slipped Roof Tiles Following Storm',
    trade: 'roofing',
    description: 'Three slate roof tiles slipped on two-storey semi-detached house. Needs inspection and safe refitting before rain returns.',
    postcode: 'B1 1BB',
    urgency: 'within_48h',
    budgetMin: 150,
    budgetMax: 300,
    status: 'open',
    bidCount: 1,
    createdAt: '2026-10-15T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
  },
  {
    id: 'job-104',
    customerId: 'cust-4',
    title: 'Front Door Yale Lock Jammed / Replacement',
    trade: 'locksmith',
    description: 'Nightlatch key cylinder sticking and hard to turn. Looking to replace with British Standard Euro cylinder.',
    postcode: 'BS1 4ST',
    urgency: 'flexible',
    budgetMin: 90,
    budgetMax: 160,
    status: 'open',
    bidCount: 3,
    createdAt: '2026-10-13T16:45:00Z',
    updatedAt: '2026-10-13T16:45:00Z',
  },
];

const TRADE_CATEGORIES: { id: TradeCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Trades' },
  { id: 'plumbing', label: '🔧 Plumbing' },
  { id: 'electrical', label: '⚡ Electrical' },
  { id: 'roofing', label: '🏠 Roofing' },
  { id: 'carpentry', label: '🪚 Carpentry' },
  { id: 'heating', label: '🔥 Heating & Gas' },
  { id: 'painting', label: '🖌️ Painting' },
  { id: 'locksmith', label: '🔑 Locksmith' },
  { id: 'general', label: '🛠️ General Repair' },
];

export const JobMarketplace: FC<{ authToken?: string }> = ({ authToken }) => {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [verifiedOwnerToken, setVerifiedOwnerToken] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<TradeCategory | 'all'>('all');
  const [searchPostcode, setSearchPostcode] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // New Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobTrade, setJobTrade] = useState<TradeCategory>('plumbing');
  const [jobDesc, setJobDesc] = useState('');
  const [jobPostcode, setJobPostcode] = useState('');
  const [jobUrgency, setJobUrgency] = useState<JobUrgency>('today');
  const [budgetMin, setBudgetMin] = useState<number>(100);
  const [budgetMax, setBudgetMax] = useState<number>(200);

  // Trade Alert Signup State (clean migration from job-alerts-frontend)
  const [alertEmail, setAlertEmail] = useState('');
  const [alertTrade, setAlertTrade] = useState<TradeCategory>('plumbing');
  const [alertPostcode, setAlertPostcode] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    if (!authToken) return () => { active = false; };

    const ownerAi = new OwnerAiService();
    ownerAi.getDashboard(authToken)
      .then(() => { if (active) setVerifiedOwnerToken(authToken); })
      .catch(() => { if (active) setVerifiedOwnerToken(''); });

    return () => { active = false; };
  }, [authToken]);

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => {
    if (selectedTrade !== 'all' && j.trade !== selectedTrade) return false;
    if (searchPostcode.trim()) {
      return j.postcode.toLowerCase().includes(searchPostcode.trim().toLowerCase());
    }
    return true;
  });

  const handlePostJob = (e: FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDesc.trim()) return;

    const newJob: Job = {
      id: 'job-' + Date.now(),
      customerId: 'cust-local',
      title: jobTitle.trim(),
      trade: jobTrade,
      description: jobDesc.trim(),
      postcode: jobPostcode.trim().toUpperCase() || 'UK WIDE',
      urgency: jobUrgency,
      budgetMin,
      budgetMax,
      status: 'open',
      bidCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setJobs((prev) => [newJob, ...prev]);
    setIsPostModalOpen(false);
    // Reset form
    setJobTitle('');
    setJobDesc('');
    setJobPostcode('');
  };

  const handleAlertSignup = (e: FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim()) return;
    setAlertSuccess(true);
    setTimeout(() => {
      setAlertEmail('');
      setAlertPostcode('');
      setAlertSuccess(false);
    }, 4000);
  };

  const guidance = getTradeCategoryGuidance(jobTrade);

  return (
    <div className="buildrush-marketplace">
      {/* Top Navbar */}
      <nav className="buildrush-nav" aria-label="Main Navigation">
        <div className="buildrush-nav-container">
          <a href="#/buildrush" className="buildrush-logo-row">
            <div className="buildrush-logo-icon">⚡</div>
            <div className="buildrush-logo-text">
              Build<span>Rush</span>
            </div>
          </a>

          <div className="buildrush-nav-actions">
            {authToken && verifiedOwnerToken === authToken && (
              <a href="#/owner" className="buildrush-nav-link" title="Private Owner Headquarters">
                🔒 Owner HQ
              </a>
            )}
            <button
              type="button"
              className="buildrush-btn-chat-trigger"
              onClick={() => setIsChatOpen(true)}
              aria-label="Open Rushie AI Assistant"
            >
              <img
                src="/buildrush/customer-ai-avatar.svg"
                alt=""
                className="buildrush-trigger-avatar"
              />
              <span>Ask AI Guide</span>
            </button>
            <button
              type="button"
              className="buildrush-btn-post"
              onClick={() => setIsPostModalOpen(true)}
            >
              + Post a Job
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="buildrush-hero">
        <div className="buildrush-hero-badge">
          <span>⚡ Fast UK Repair Marketplace</span>
          <span>•</span>
          <span>Targeting Same-Day / 48-Hour Response</span>
        </div>
        <h1 className="buildrush-hero-title">
          Connect with Verified UK Tradespeople <span>in Minutes</span>
        </h1>
        <p className="buildrush-hero-sub">
          Post your repair job with sensible UK pricing benchmarks. Get competitive bids from verified plumbers, electricians, roofers, and local trades.
        </p>
        <div className="buildrush-hero-cta-group">
          <button
            type="button"
            className="buildrush-btn-hero-primary"
            onClick={() => setIsPostModalOpen(true)}
          >
            Post a Job in 60 Seconds
          </button>
          <button
            type="button"
            className="buildrush-btn-hero-secondary"
            onClick={() => setIsChatOpen(true)}
          >
            Get UK Repair Pricing Advice (AI)
          </button>
        </div>
      </header>

      {/* Trade Category Filter Chips */}
      <section className="buildrush-filters-section" aria-label="Filter Jobs by Trade">
        <div className="buildrush-trade-chips">
          {TRADE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`buildrush-trade-chip ${selectedTrade === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedTrade(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid: Job Listings + Sidebar */}
      <main className="buildrush-main-content">
        {/* Job Listings Column */}
        <section aria-label="Available Repair Jobs">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Live Repair Jobs ({filteredJobs.length})
            </h2>
            <input
              type="text"
              className="buildrush-input"
              style={{ width: '180px', padding: '0.4rem 0.65rem' }}
              placeholder="Search postcode..."
              value={searchPostcode}
              onChange={(e) => setSearchPostcode(e.target.value)}
            />
          </div>

          <div className="buildrush-jobs-list">
            {filteredJobs.length === 0 ? (
              <div className="buildrush-job-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#94a3b8', margin: 0 }}>No jobs found matching your criteria.</p>
              </div>
            ) : (
              filteredJobs.map((j) => (
                <article key={j.id} className="buildrush-job-card">
                  <div className="buildrush-job-header">
                    <h3 className="buildrush-job-title">{j.title}</h3>
                    <span className={`buildrush-job-urgency urgency-${j.urgency}`}>
                      {j.urgency}
                    </span>
                  </div>
                  <p className="buildrush-job-desc">{j.description}</p>
                  <div className="buildrush-job-meta-row">
                    <div className="buildrush-job-meta-item">
                      Trade: <strong>{j.trade.toUpperCase()}</strong>
                    </div>
                    <div className="buildrush-job-meta-item">
                      Location: <strong>{j.postcode}</strong>
                    </div>
                    <div className="buildrush-job-meta-item">
                      Customer Budget: <strong>£{j.budgetMin} - £{j.budgetMax}</strong>
                    </div>
                    <div className="buildrush-job-meta-item">
                      Active Bids: <strong>{j.bidCount ?? 0}</strong>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Sidebar Column: Trade Alerts & Grounded Benchmark */}
        <aside className="buildrush-sidebar">
          {/* Trade Alerts Signup */}
          <div className="buildrush-side-card">
            <h3 className="buildrush-side-title">
              <span>🔔</span> Tradesperson Job Alerts
            </h3>
            <p className="buildrush-side-text">
              Receive instant SMS and email notifications when new emergency or standard jobs are posted in your UK trade area.
            </p>
            {alertSuccess ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                ✓ Subscribed! You will receive verified trade notifications.
              </div>
            ) : (
              <form className="buildrush-alert-form" onSubmit={handleAlertSignup}>
                <input
                  type="email"
                  required
                  placeholder="Your business email..."
                  className="buildrush-input"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                />
                <select
                  className="buildrush-input"
                  value={alertTrade}
                  onChange={(e) => setAlertTrade(e.target.value as TradeCategory)}
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="roofing">Roofing</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="heating">Heating &amp; Gas</option>
                  <option value="painting">Painting</option>
                  <option value="locksmith">Locksmith</option>
                  <option value="general">General Repair</option>
                </select>
                <input
                  type="text"
                  placeholder="Postcode area (e.g. SW1, B1, M1)"
                  className="buildrush-input"
                  value={alertPostcode}
                  onChange={(e) => setAlertPostcode(e.target.value)}
                />
                <button type="submit" className="buildrush-btn-alert">
                  Enable Job Alerts
                </button>
              </form>
            )}
          </div>

          {/* Pricing Benchmark Summary */}
          <div className="buildrush-side-card">
            <h3 className="buildrush-side-title">
              <span>🇬🇧</span> UK Price Benchmark Guide
            </h3>
            <p className="buildrush-side-text">
              BuildRush uses grounded UK marketplace benchmarks (£40–£80/hr typical). Customers set their own budget; tradespeople bid competitively.
            </p>
            <div style={{ fontSize: '0.825rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>• <strong>Plumbing:</strong> £45 – £80/hr (£85+ basic call-out)</div>
              <div>• <strong>Electrical:</strong> £50 – £85/hr (18th Edition certified)</div>
              <div>• <strong>Roofing:</strong> £50 – £90/hr (Access &amp; safety factored)</div>
              <div>• <strong>Locksmith:</strong> £65 – £110/hr (Emergency 24/7)</div>
            </div>
            <p style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '1rem', marginBottom: 0 }}>
              *Estimates only. Emergency call-outs outside 8am–6pm may incur 1.5×–2× premiums.
            </p>
          </div>
        </aside>
      </main>

      {/* Post a Job Modal */}
      {isPostModalOpen && (
        <div className="buildrush-modal-overlay" role="dialog" aria-modal="true">
          <div className="buildrush-modal-card">
            <div className="buildrush-modal-header">
              <h2>Post a Repair Job</h2>
              <button
                type="button"
                className="buildrush-chat-close-btn"
                onClick={() => setIsPostModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Job Headline
                </label>
                <input
                  type="text"
                  required
                  className="buildrush-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="e.g. Leaking radiator valve in living room"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Trade Category
                  </label>
                  <select
                    className="buildrush-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={jobTrade}
                    onChange={(e) => setJobTrade(e.target.value as TradeCategory)}
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="roofing">Roofing</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="heating">Heating &amp; Gas</option>
                    <option value="painting">Painting</option>
                    <option value="locksmith">Locksmith</option>
                    <option value="general">General Repair</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Urgency
                  </label>
                  <select
                    className="buildrush-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={jobUrgency}
                    onChange={(e) => setJobUrgency(e.target.value as JobUrgency)}
                  >
                    <option value="today">Emergency (Today / Immediate)</option>
                    <option value="tomorrow">Urgent (Tomorrow)</option>
                    <option value="within_48h">Prompt (Within 48 hours)</option>
                    <option value="flexible">Flexible / Standard</option>
                  </select>
                </div>
              </div>

              {/* Dynamic UK Guidance Helper */}
              <div className="buildrush-guidance-pill">
                <strong>UK Benchmark for {guidance.displayName}:</strong> Typical hourly rate is £{guidance.typicalHourlyMin}–£{guidance.typicalHourlyMax}/hr. Minor repairs typically £{guidance.minorJobMin}–£{guidance.minorJobMax}.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={4}
                  className="buildrush-input"
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                  placeholder="Describe the issue, access conditions, and what you have checked..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    UK Postal Area
                  </label>
                  <input
                    type="text"
                    required
                    className="buildrush-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. SW1A"
                    value={jobPostcode}
                    onChange={(e) => setJobPostcode(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Budget Min (£)
                  </label>
                  <input
                    type="number"
                    min={20}
                    className="buildrush-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Budget Max (£)
                  </label>
                  <input
                    type="number"
                    min={budgetMin}
                    className="buildrush-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="buildrush-btn-hero-secondary"
                  onClick={() => setIsPostModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="buildrush-btn-post">
                  Publish Job to Tradespeople
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer AI Assistant Chat */}
      <CustomerAiChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onPreFillJob={(data) => {
          if (data.tradeCategory) setJobTrade(data.tradeCategory);
          if (data.suggestedBudgetMin) setBudgetMin(data.suggestedBudgetMin);
          if (data.suggestedBudgetMax) setBudgetMax(data.suggestedBudgetMax);
          if (data.description) setJobDesc(data.description);
          setIsPostModalOpen(true);
        }}
      />
    </div>
  );
};
