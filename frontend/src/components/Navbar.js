import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthCtx } from '../App';

export default function Navbar() {
  const { user, logout } = useContext(AuthCtx);
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Brand */}
        <div style={styles.brand} onClick={() => navigate('/dashboard')}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#1B4332"/>
            <path d="M4 16l4-4 3 3 5-6 4 4" stroke="#A8C5AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 6h4v4" stroke="#E07A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={styles.brandText}>TradeSwift</span>
        </div>

        {/* Right side */}
        <div style={styles.right}>
          {user?.is_admin && (
            <button onClick={() => navigate('/admin')} style={styles.adminBtn}>
              ⚙ Admin
            </button>
          )}
          <div style={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
          <span style={styles.username}>{user?.username}</span>
          <button onClick={() => { logout(); navigate('/login'); }} style={styles.logoutBtn}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background:'#FFFFFF',
    borderBottom:'1.5px solid #D8D3C5',
    position:'sticky', top:0, zIndex:100,
    boxShadow:'0 1px 6px rgba(27,67,50,0.07)',
  },
  inner: {
    maxWidth:1100, margin:'0 auto',
    padding:'0 1.25rem',
    height:62, display:'flex',
    alignItems:'center', justifyContent:'space-between',
  },
  brand: {
    display:'flex', alignItems:'center', gap:'0.6rem',
    cursor:'pointer', userSelect:'none',
  },
  brandText: {
    fontWeight:800, fontSize:'1.2rem',
    color:'#1B4332', letterSpacing:'-0.02em',
  },
  right: { display:'flex', alignItems:'center', gap:'0.75rem' },
  avatar: {
    width:34, height:34, borderRadius:'50%',
    background:'linear-gradient(135deg,#1B4332,#2D6A4F)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:700, fontSize:'0.9rem', color:'#fff',
  },
  username: { fontSize:'0.9rem', color:'#1A1A1A', fontWeight:500 },
  adminBtn: {
    background:'rgba(27,67,50,0.08)',
    color:'#1B4332', border:'1px solid rgba(27,67,50,0.25)',
    borderRadius:7, padding:'0.35rem 0.85rem',
    fontSize:'0.82rem', fontWeight:600,
  },
  logoutBtn: {
    background:'rgba(224,122,95,0.1)',
    color:'#C4604A', border:'1px solid rgba(224,122,95,0.3)',
    borderRadius:7, padding:'0.35rem 0.85rem',
    fontSize:'0.82rem', fontWeight:600,
  },
};
