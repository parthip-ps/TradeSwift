import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthCtx } from '../App';

export default function Login() {
  const { login }    = useContext(AuthCtx);
  const navigate     = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(form.username.trim().toLowerCase(), form.password);
      navigate('/dashboard');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left decorative panel */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroLogo}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="7" fill="rgba(255,255,255,0.15)"/>
              <path d="M4 16l4-4 3 3 5-6 4 4" stroke="#A8C5AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 6h4v4" stroke="#E07A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={styles.heroName}>TradeSwift</span>
          </div>
          <h2 style={styles.heroTitle}>Predict the perfect moment to sell.</h2>
          <p style={styles.heroDesc}>
            AI-driven technical analysis across RSI, MACD, Bollinger Bands, and more — giving you the top 5 sell windows for your holdings.
          </p>
          <div style={styles.heroBadges}>
            {['yfinance powered','Real market data','5 sell signals','Instant results'].map(b => (
              <span key={b} style={styles.heroBadge}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={styles.formPanel}>
        <div style={styles.card}>
          <h1 style={styles.cardTitle}>Welcome back</h1>
          <p style={styles.cardSub}>Sign in to your TradeSwift account</p>

          <form onSubmit={submit} style={styles.form}>
            <div>
              <label>Username</label>
              <input type="text" placeholder="your_username"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                required autoFocus />
            </div>
            <div>
              <label>Password</label>
              <input type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required />
            </div>
            {err && <div className="error-msg">{err}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p style={styles.footer}>
            No account? <Link to="/register">Create one free</Link>
          </p>
        </div>
        <p style={styles.disclaimer}>
          ⚠️ For educational & informational purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight:'100vh', display:'flex',
  },
  hero: {
    flex:'0 0 44%', background:'linear-gradient(160deg,#1B4332 0%,#2D6A4F 60%,#74A07B 100%)',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'3rem 2.5rem',
    '@media(maxWidth:768px)': { display:'none' },
  },
  heroInner: { maxWidth:380 },
  heroLogo: { display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'2.5rem' },
  heroName: { color:'#fff', fontWeight:800, fontSize:'1.6rem', letterSpacing:'-0.03em' },
  heroTitle: { color:'#fff', fontSize:'1.6rem', fontWeight:800, lineHeight:1.3, marginBottom:'1rem' },
  heroDesc: { color:'rgba(255,255,255,0.75)', fontSize:'0.92rem', lineHeight:1.7, marginBottom:'1.75rem' },
  heroBadges: { display:'flex', flexWrap:'wrap', gap:'0.5rem' },
  heroBadge: {
    background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)',
    color:'rgba(255,255,255,0.9)', borderRadius:20,
    padding:'0.25rem 0.75rem', fontSize:'0.78rem', fontWeight:500,
  },
  formPanel: {
    flex:1, background:'#F9F8F3',
    display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    padding:'2rem 1.5rem',
  },
  card: {
    background:'#FFFFFF', border:'1.5px solid #D8D3C5',
    borderRadius:16, padding:'2.25rem',
    width:'100%', maxWidth:400,
    boxShadow:'0 4px 24px rgba(27,67,50,0.08)',
    animation:'fadeIn 0.3s ease',
  },
  cardTitle: { fontSize:'1.5rem', fontWeight:800, color:'#1A1A1A', marginBottom:'0.25rem' },
  cardSub: { color:'#6B6B5E', fontSize:'0.9rem', marginBottom:'1.75rem' },
  form: { display:'flex', flexDirection:'column', gap:'1rem' },
  footer: { textAlign:'center', marginTop:'1.25rem', fontSize:'0.88rem', color:'#6B6B5E' },
  disclaimer: { marginTop:'1.5rem', fontSize:'0.75rem', color:'#9E9E8C', maxWidth:400, textAlign:'center' },
};
