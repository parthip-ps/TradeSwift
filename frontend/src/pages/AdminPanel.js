import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';

export default function AdminPanel() {
  const [tab, setTab]     = useState('users');
  const [users, setUsers] = useState([]);
  const [preds, setPreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/admin/users'),
      api.get('/api/admin/predictions'),
    ])
      .then(([u, p]) => { setUsers(u.data); setPreds(p.data); })
      .catch(() => setErr('Failed to load admin data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main style={styles.main}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>Admin Dashboard</h2>
            <p style={styles.sub}>Manage users and monitor prediction activity</p>
          </div>
          <div style={styles.statRow}>
            <StatPill icon="👤" label="Total Users"  value={users.length}  color="#1B4332" />
            <StatPill icon="🔮" label="Predictions" value={preds.length}  color="#E07A5F" />
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {[['users','👤 Users'],['predictions','🔮 Predictions']].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tabBtn,
                borderBottom:  tab === t ? '2.5px solid #1B4332' : '2.5px solid transparent',
                color:         tab === t ? '#1B4332' : '#9E9E8C',
                fontWeight:    tab === t ? 700 : 500,
              }}
            >{label}</button>
          ))}
        </div>

        {err && <div className="error-msg" style={{marginBottom:'1rem'}}>{err}</div>}

        {loading
          ? <div style={{textAlign:'center',padding:'3rem',color:'#9E9E8C'}}>Loading…</div>
          : tab === 'users'
            ? <UsersTable users={users} />
            : <PredTable preds={preds} />
        }
      </main>
    </>
  );
}

function StatPill({ icon, label, value, color }) {
  return (
    <div style={{
      background:'#FFFFFF', border:'1.5px solid #D8D3C5',
      borderRadius:12, padding:'0.75rem 1.1rem',
      display:'flex', alignItems:'center', gap:'0.75rem',
      boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <span style={{fontSize:'1.25rem'}}>{icon}</span>
      <div>
        <div style={{fontWeight:700, fontSize:'1.2rem', color}}>{value}</div>
        <div style={{fontSize:'0.72rem', color:'#9E9E8C', textTransform:'uppercase', letterSpacing:'0.04em'}}>{label}</div>
      </div>
    </div>
  );
}

function UsersTable({ users }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {['ID','Username','Email','Role','Registered'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id} style={{background: i%2===0 ? '#FFFFFF' : '#FAFAF7'}}>
              <td style={styles.td}>{u.id}</td>
              <td style={{...styles.td, fontWeight:600, color:'#1B4332'}}>{u.username}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>
                <span style={{
                  padding:'0.15rem 0.6rem', borderRadius:5, fontSize:'0.75rem', fontWeight:600,
                  background: u.is_admin ? 'rgba(224,122,95,0.12)' : 'rgba(27,67,50,0.08)',
                  color: u.is_admin ? '#C4604A' : '#2D6A4F',
                }}>
                  {u.is_admin ? 'Admin' : 'User'}
                </span>
              </td>
              <td style={styles.td}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PredTable({ preds }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {['ID','User','Ticker','Amount','Buy Date','Queried At'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preds.map((p, i) => (
            <tr key={p.id} style={{background: i%2===0 ? '#FFFFFF' : '#FAFAF7'}}>
              <td style={styles.td}>{p.id}</td>
              <td style={{...styles.td, fontWeight:600}}>{p.username}</td>
              <td style={{...styles.td, color:'#1B4332', fontWeight:700}}>{p.ticker}</td>
              <td style={styles.td}>{p.amount.toLocaleString()}</td>
              <td style={styles.td}>{p.buy_date}</td>
              <td style={styles.td}>{new Date(p.created_at).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  main: { maxWidth:1100, margin:'0 auto', padding:'2rem 1.25rem' },
  headerRow: {
    display:'flex', alignItems:'flex-start', justifyContent:'space-between',
    flexWrap:'wrap', gap:'1rem', marginBottom:'1.75rem',
  },
  title: { fontSize:'1.5rem', fontWeight:800, color:'#1A1A1A' },
  sub:   { color:'#6B6B5E', fontSize:'0.88rem', marginTop:'0.2rem' },
  statRow: { display:'flex', gap:'0.75rem', flexWrap:'wrap' },
  tabs: { display:'flex', borderBottom:'1.5px solid #D8D3C5', marginBottom:'1.5rem' },
  tabBtn: {
    padding:'0.65rem 1.4rem', background:'transparent',
    fontSize:'0.9rem', cursor:'pointer', borderRadius:0,
    transition:'color 0.15s',
  },
  tableWrap: {
    overflowX:'auto', borderRadius:12,
    border:'1.5px solid #D8D3C5',
    boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
  },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'0.88rem' },
  th: {
    textAlign:'left', padding:'0.8rem 1rem',
    background:'#F0EDE4', color:'#6B6B5E',
    fontSize:'0.75rem', fontWeight:700,
    textTransform:'uppercase', letterSpacing:'0.05em',
    borderBottom:'1.5px solid #D8D3C5',
  },
  td: { padding:'0.72rem 1rem', color:'#1A1A1A', borderBottom:'1px solid #F0EDE4' },
};
