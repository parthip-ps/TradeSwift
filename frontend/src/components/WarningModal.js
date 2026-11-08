import React, { useState } from 'react';

export default function WarningModal({ onClose }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.iconWrap}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L22 21H2L12 3Z" fill="#E07A5F" opacity="0.15" stroke="#E07A5F" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M12 10V14" stroke="#E07A5F" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="17.5" r="1" fill="#E07A5F"/>
          </svg>
        </div>

        <h2 style={styles.title}>Important Risk Disclaimer</h2>
        <div style={styles.divider} />

        <div style={styles.body}>
          <p style={styles.lead}>
            ⚠️ <strong>These are AI-generated predictions only.</strong>
          </p>
          <ul style={styles.list}>
            <li>Predictions are based on <strong>historical data and technical analysis</strong> — they do <strong>not</strong> guarantee future results.</li>
            <li>Stock markets are <strong>highly volatile</strong>. Prices can rise or fall unpredictably due to economic events, news, or market sentiment.</li>
            <li>TradeSwift is <strong>NOT</strong> a substitute for professional financial advice. Always consult a <strong>SEBI-registered or certified financial advisor</strong> before making investment decisions.</li>
            <li>You may <strong>lose part or all</strong> of your invested capital. <em>Invest only what you can afford to lose.</em></li>
            <li>Past performance shown here is <strong>not indicative of future performance</strong>.</li>
          </ul>
          <p style={styles.legal}>
            By clicking <strong>"I Understand, Continue"</strong> you acknowledge that TradeSwift is a prediction tool for <em>informational purposes only</em>, and you accept full responsibility for any investment decisions you make.
          </p>
        </div>

        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ width:'auto', marginRight:'0.5rem', accentColor:'#1B4332' }}
          />
          I have read and understood the disclaimer above
        </label>

        <button
          onClick={onClose}
          disabled={!agreed}
          style={{
            ...styles.btn,
            opacity: agreed ? 1 : 0.4,
            cursor:  agreed ? 'pointer' : 'not-allowed',
          }}
        >
          I Understand, Continue →
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position:'fixed', inset:0, zIndex:9999,
    background:'rgba(249,248,243,0.85)', backdropFilter:'blur(8px)',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'1rem',
    animation:'fadeIn 0.25s ease',
  },
  modal: {
    background:'#FFFFFF',
    border:'2px solid #E07A5F',
    borderRadius:18,
    padding:'2rem',
    maxWidth:560,
    width:'100%',
    boxShadow:'0 20px 60px rgba(27,67,50,0.15)',
  },
  iconWrap: { textAlign:'center', marginBottom:'0.75rem' },
  title: {
    textAlign:'center', fontSize:'1.25rem', fontWeight:800,
    color:'#E07A5F', marginBottom:'0.75rem',
  },
  divider: { height:1, background:'#D8D3C5', marginBottom:'1.25rem' },
  body: { marginBottom:'1.25rem' },
  lead: { fontSize:'0.98rem', color:'#1A1A1A', marginBottom:'0.75rem' },
  list: {
    paddingLeft:'1.3rem', display:'flex', flexDirection:'column', gap:'0.6rem',
    fontSize:'0.88rem', color:'#444444', marginBottom:'1rem',
  },
  legal: {
    fontSize:'0.82rem', color:'#6B6B5E',
    background:'rgba(224,122,95,0.07)',
    border:'1px solid rgba(224,122,95,0.25)',
    padding:'0.6rem 0.9rem', borderRadius:8,
  },
  checkLabel: {
    display:'flex', alignItems:'center', fontSize:'0.88rem',
    color:'#1A1A1A', marginBottom:'1.25rem', cursor:'pointer',
    textTransform:'none', letterSpacing:0,
  },
  btn: {
    width:'100%', padding:'0.85rem',
    background:'linear-gradient(135deg,#E07A5F,#C4604A)',
    color:'#fff', fontWeight:700, fontSize:'0.95rem',
    border:'none', borderRadius:10, cursor:'pointer',
    transition:'opacity 0.2s',
    boxShadow:'0 2px 10px rgba(224,122,95,0.35)',
  },
};
