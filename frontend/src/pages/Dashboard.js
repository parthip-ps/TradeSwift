import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';

const POPULAR = ['AAPL','TSLA','MSFT','AMZN','NVDA','GOOGL','RELIANCE.NS','TCS.NS','INFY.NS','HDFCBANK.NS'];

export default function Dashboard() {
  const [form, setForm]       = useState({ ticker:'', amount:'', buy_date:'' });
  const [result, setResult]   = useState(null);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr(''); setResult(null); setLoading(true);
    try {
      const { data } = await api.post('/api/predict', form);
      setResult(data);
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior:'smooth' }), 100);
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Prediction failed. Check the ticker symbol.');
    } finally {
      setLoading(false);
    }
  };

  const setTicker = t => setForm(f => ({...f, ticker: t}));

  return (
    <>
      <Navbar />
      <main style={styles.main}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <h2 style={styles.pageTitle}>Predict Your Best Sell Days</h2>
            <p style={styles.pageSub}>Enter your investment details and get AI-powered sell-day recommendations.</p>
          </div>
          <div style={styles.headerBadge}>
            <span style={styles.liveDot} />
            Live market data
          </div>
        </div>

        {/* Quick ticker chips */}
        <div style={styles.chipsWrap}>
          <span style={styles.chipsLabel}>Quick pick →</span>
          {POPULAR.map(t => (
            <button
              key={t}
              onClick={() => setTicker(t)}
              style={{
                ...styles.chip,
                borderColor:  form.ticker === t ? '#1B4332' : '#D8D3C5',
                color:        form.ticker === t ? '#1B4332' : '#6B6B5E',
                background:   form.ticker === t ? 'rgba(27,67,50,0.08)' : '#FFFFFF',
                fontWeight:   form.ticker === t ? 700 : 500,
              }}
            >{t}</button>
          ))}
        </div>

        {/* Input form */}
        <div style={styles.formCard}>
          <form onSubmit={submit} style={styles.formGrid}>
            <div>
              <label>Stock Ticker Symbol</label>
              <input
                type="text"
                placeholder="e.g. AAPL, TSLA, RELIANCE.NS"
                value={form.ticker}
                onChange={e => setForm({...form, ticker: e.target.value.toUpperCase()})}
                required
              />
              <span style={styles.hint}>NSE stocks: append .NS (TCS.NS) | BSE: .BO</span>
            </div>
            <div>
              <label>Amount Invested (₹ / $)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                min="1"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                required
              />
            </div>
            <div>
              <label>Date of Investment</label>
              <input
                type="date"
                value={form.buy_date}
                onChange={e => setForm({...form, buy_date: e.target.value})}
                required
                max={new Date().toISOString().slice(0,10)}
              />
            </div>
            <div style={{ gridColumn:'1 / -1', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {err && <div className="error-msg">{err}</div>}
              <button type="submit" className="btn-primary" disabled={loading} style={{maxWidth:280}}>
                {loading ? '⏳ Analysing market data…' : '🔮 Predict Best Sell Days'}
              </button>
            </div>
          </form>
        </div>

        {/* Loading state */}
        {loading && <LoadingCard />}

        {/* Results */}
        {result && !loading && <div id="results"><ResultCard result={result} /></div>}
      </main>
    </>
  );
}

function LoadingCard() {
  return (
    <div style={styles.loadingCard}>
      <div style={styles.spinner} />
      <div>
        <p style={{fontWeight:600, color:'#1B4332', marginBottom:'0.25rem'}}>Fetching market data…</p>
        <p style={{color:'#6B6B5E', fontSize:'0.85rem'}}>Running technical analysis — this takes 10–20 seconds</p>
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const best = result.top5_sell_days[0];
  const isProfit = best?.estimated_return_pct >= 0;

  return (
    <div style={{animation:'fadeIn 0.4s ease'}}>
      {/* Stats strip */}
      <div style={styles.statsStrip}>
        <Stat label="Ticker"        value={result.ticker}        color="#1B4332" />
        <Stat label="Buy Price"     value={`${result.stock_info.currency} ${result.buy_price}`} />
        <Stat label="Current Price" value={`${result.stock_info.currency} ${result.current_price}`} />
        <Stat label="Shares Held"   value={result.shares_owned} />
        <Stat
          label="Best Est. Return"
          value={`${best?.estimated_return_pct}%`}
          color={isProfit ? '#2D6A4F' : '#C4604A'}
          bg={isProfit ? 'rgba(27,67,50,0.06)' : 'rgba(224,122,95,0.08)'}
        />
      </div>

      {/* Top 5 grid */}
      <h3 style={styles.sectionTitle}>📅 Top 5 Predicted Sell Days</h3>
      <div style={styles.top5Grid}>
        {result.top5_sell_days.map((day, i) => (
          <SellCard key={day.date} day={day} rank={i+1} currency={result.stock_info.currency} />
        ))}
      </div>

      {/* Disclaimer */}
      <div style={styles.disclaimer}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,marginTop:2}}>
          <path d="M12 3L22 21H2L12 3Z" fill="#E07A5F" opacity="0.2" stroke="#E07A5F" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M12 10V14" stroke="#E07A5F" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="17.5" r="1" fill="#E07A5F"/>
        </svg>
        <span>{result.disclaimer}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, color='#1A1A1A', bg='#FFFFFF' }) {
  return (
    <div style={{...styles.statTile, background: bg}}>
      <div style={{...styles.statVal, color}}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function SellCard({ day, rank, currency }) {
  const isProfit = day.estimated_return_pct >= 0;
  const isFirst  = rank === 1;
  return (
    <div style={{
      ...styles.sellCard,
      borderColor: isFirst ? '#E07A5F' : '#D8D3C5',
      borderWidth:  isFirst ? 2 : 1,
      background:   isFirst ? 'linear-gradient(135deg,#FFF,#FEF3F0)' : '#FFFFFF',
      boxShadow:    isFirst ? '0 4px 20px rgba(224,122,95,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={styles.sellTop}>
        <span style={{
          fontWeight:800, fontSize:'0.85rem',
          color: isFirst ? '#E07A5F' : '#74A07B',
        }}>#{rank}</span>
        {isFirst && <span style={styles.bestBadge}>⭐ Best Pick</span>}
        <span style={styles.conf}>{day.confidence_score}%</span>
      </div>
      <div style={styles.sellDate}>{formatDate(day.date)}</div>
      <div style={styles.sellPrice}>
        <span style={{color:'#6B6B5E', fontSize:'0.78rem'}}>{currency} </span>
        <strong style={{fontSize:'1.3rem', color:'#1A1A1A'}}>{day.predicted_price.toLocaleString()}</strong>
      </div>
      <div style={styles.returnRow}>
        <span style={{
          color: isProfit ? '#2D6A4F' : '#C4604A',
          fontWeight:700, fontSize:'0.92rem',
          background: isProfit ? 'rgba(27,67,50,0.08)' : 'rgba(224,122,95,0.1)',
          padding:'0.2rem 0.55rem', borderRadius:5,
        }}>
          {isProfit ? '▲' : '▼'} {Math.abs(day.estimated_return_pct)}%
        </span>
        <span style={{fontSize:'0.8rem', color: isProfit ? '#2D6A4F' : '#C4604A', fontWeight:600}}>
          {currency} {day.estimated_profit.toLocaleString()}
        </span>
      </div>
      <div style={styles.signals}>{day.signal_summary}</div>
    </div>
  );
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-IN', {
    weekday:'short', day:'2-digit', month:'short', year:'numeric'
  });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  main: { maxWidth:1100, margin:'0 auto', padding:'2rem 1.25rem' },

  pageHeader: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem',
  },
  pageTitle: { fontSize:'1.6rem', fontWeight:800, color:'#1A1A1A' },
  pageSub:   { color:'#6B6B5E', fontSize:'0.9rem', marginTop:'0.2rem' },
  headerBadge: {
    display:'flex', alignItems:'center', gap:'0.5rem',
    background:'rgba(27,67,50,0.07)', border:'1px solid rgba(27,67,50,0.2)',
    color:'#1B4332', borderRadius:20, padding:'0.3rem 0.9rem',
    fontSize:'0.8rem', fontWeight:600,
  },
  liveDot: {
    width:7, height:7, borderRadius:'50%',
    background:'#2D6A4F', display:'inline-block',
    animation:'pulse 2s infinite',
  },

  chipsWrap: { display:'flex', flexWrap:'wrap', gap:'0.4rem', alignItems:'center', marginBottom:'1.25rem' },
  chipsLabel: { fontSize:'0.78rem', color:'#9E9E8C', marginRight:'0.25rem' },
  chip: {
    padding:'0.3rem 0.7rem', borderRadius:20,
    fontSize:'0.78rem', border:'1.5px solid',
    cursor:'pointer', transition:'all 0.15s',
    background:'#FFFFFF',
  },

  formCard: {
    background:'#FFFFFF', border:'1.5px solid #D8D3C5',
    borderRadius:14, padding:'1.5rem',
    marginBottom:'1.5rem',
    boxShadow:'0 1px 6px rgba(27,67,50,0.06)',
  },
  formGrid: {
    display:'grid',
    gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',
    gap:'1rem', alignItems:'end',
  },
  hint: { fontSize:'0.74rem', color:'#9E9E8C', marginTop:'0.3rem', display:'block' },

  loadingCard: {
    background:'#FFFFFF', border:'1.5px solid #D8D3C5',
    borderRadius:14, padding:'2rem 1.5rem',
    display:'flex', alignItems:'center', gap:'1.25rem',
    marginBottom:'1.5rem',
  },
  spinner: {
    flexShrink:0, width:38, height:38, borderRadius:'50%',
    border:'3px solid #D8D3C5', borderTop:'3px solid #1B4332',
    animation:'spin 0.8s linear infinite',
  },

  statsStrip: {
    display:'flex', flexWrap:'wrap', gap:'0.75rem', marginBottom:'1.5rem',
  },
  statTile: {
    flex:'1 1 130px', border:'1.5px solid #D8D3C5',
    borderRadius:12, padding:'0.9rem 1rem',
  },
  statVal:   { fontSize:'1.05rem', fontWeight:700, marginBottom:'0.2rem' },
  statLabel: { fontSize:'0.72rem', color:'#9E9E8C', textTransform:'uppercase', letterSpacing:'0.05em' },

  sectionTitle: {
    fontWeight:700, fontSize:'1rem', color:'#1A1A1A',
    marginBottom:'0.9rem', display:'flex', alignItems:'center', gap:'0.4rem',
  },
  top5Grid: {
    display:'grid',
    gridTemplateColumns:'repeat(auto-fill,minmax(188px,1fr))',
    gap:'0.9rem', marginBottom:'1.5rem',
  },
  sellCard: {
    border:'1px solid', borderRadius:12, padding:'1rem',
    display:'flex', flexDirection:'column', gap:'0.4rem',
  },
  sellTop: { display:'flex', alignItems:'center', gap:'0.4rem' },
  bestBadge: {
    fontSize:'0.68rem', background:'rgba(224,122,95,0.12)',
    border:'1px solid rgba(224,122,95,0.3)', color:'#C4604A',
    borderRadius:5, padding:'0.1rem 0.4rem',
  },
  conf: { marginLeft:'auto', fontSize:'0.73rem', color:'#9E9E8C', fontWeight:600 },
  sellDate:  { fontWeight:600, fontSize:'0.86rem', color:'#1A1A1A' },
  sellPrice: { display:'flex', alignItems:'baseline', gap:'0.1rem' },
  returnRow: { display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'0.3rem', alignItems:'center' },
  signals:   { fontSize:'0.7rem', color:'#9E9E8C', marginTop:'0.2rem', lineHeight:1.5 },

  disclaimer: {
    display:'flex', gap:'0.75rem', alignItems:'flex-start',
    background:'rgba(224,122,95,0.06)',
    border:'1.5px solid rgba(224,122,95,0.2)',
    borderRadius:12, padding:'0.9rem 1.1rem',
    fontSize:'0.8rem', color:'#6B6B5E', lineHeight:1.7,
  },
};
