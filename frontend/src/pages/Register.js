import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthCtx } from '../App';

export default function Register() {
  const { register } = useContext(AuthCtx);
  const navigate     = useNavigate();
  const [form, setForm] = useState({ username:'', email:'', password:'', confirm:'' });
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (form.password !== form.confirm) { setErr('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form.username.trim().toLowerCase(), form.email.trim().toLowerCase(), form.password);
      navigate('/dashboard');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroLogo}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="7" fill="rgba(255,255,255,0.15)"/>
              <path d="M4 16l4-4 3 3 5-6 4 4" stroke="#A8C5AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 6h4v4" stroke="#E07A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={styles.heroName}>TradeSwift</span>
          </div>
          <h2 style={styles.heroTitle}>Start trading smarter today.</h2>
          <p style={styles.heroDesc}>
            Create a free account to access AI-powered sell-day predictions, track your investments, and make data-driven decisions.
          </p>
          <div style={styles.features}>
            {[
              ['📈', 'Historical data analysis'],
              ['🔮', 'Top-5 sell day prediction'],
              ['🔒', 'Secure & private'],
              ['🇮🇳', 'Supports NSE / BSE stocks'],
            ].map(([icon, label]) => (
              <div key={label} style={styles.feature}>
                <span>{icon}</span>
                <span style={{color:'rgba(255,255,255,0.85)', fontSize:'0.9rem'}}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={styles.formPanel}>
        <div style={styles.card}>
          <h1 style={styles.cardTitle}>Create account</h1>
          <p style={styles.cardSub}>Join TradeSwift — it's free</p>

          <form onSubmit={submit} style={styles.form}>
            <div>
              <label>Username <span style={{color:'#E07A5F'}}>*</span></label>
              <input type="text" placeholder="must be unique"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                required autoFocus />
            </div>
            <div>
              <label>Email</label>
              <input type="email" placeholder="you@email.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required minLength={6} />
            </div>
            <div>
              <label>Confirm Password</label>
              <input type="password" placeholder="Repeat password"
                value={form.confirm}
                onChange={e => setForm({...form, confirm: e.target.value})}
                required />
            </div>
            {err && <div className="error-msg">{err}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p style={styles.footer}>
            Already have an account? <Link to="/login">Sign in</Link>
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
  page: { minHeight:'100vh', display:'flex' },
  hero: {
    flex:'0 0 44%',
    background:'linear-gradient(160deg,#1B4332 0%,#2D6A4F 60%,#74A07B 100%)',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'3rem 2.5rem',
  },
  heroInner: { maxWidth:380 },
  heroLogo: { display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'2.5rem' },
  heroName: { color:'#fff', fontWeight:800, fontSize:'1.5rem' },
  heroTitle: { color:'#fff', fontSize:'1.5rem', fontWeight:800, lineHeight:1.3, marginBottom:'1rem' },
  heroDesc: { color:'rgba(255,255,255,0.75)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:'1.75rem' },
  features: { display:'flex', flexDirection:'column', gap:'0.65rem' },
  feature: { display:'flex', alignItems:'center', gap:'0.6rem' },
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
  cardTitle: { fontSize:'1.4rem', fontWeight:800, color:'#1A1A1A', marginBottom:'0.25rem' },
  cardSub: { color:'#6B6B5E', fontSize:'0.9rem', marginBottom:'1.75rem' },
  form: { display:'flex', flexDirection:'column', gap:'1rem' },
  footer: { textAlign:'center', marginTop:'1.25rem', fontSize:'0.88rem', color:'#6B6B5E' },
  disclaimer: { marginTop:'1.5rem', fontSize:'0.75rem', color:'#9E9E8C', maxWidth:400, textAlign:'center' },
};
