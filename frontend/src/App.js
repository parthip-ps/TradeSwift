import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Login    from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import WarningModal from './components/WarningModal';

export const AuthCtx = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarn, setShowWarn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/api/me')
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/api/login', { username, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setShowWarn(true);
    return data.user;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/api/register', { username, email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setShowWarn(true);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F9F8F3' }}>
      <Spinner />
    </div>
  );

  return (
    <AuthCtx.Provider value={{ user, login, register, logout }}>
      {children}
      {showWarn && <WarningModal onClose={() => setShowWarn(false)} />}
    </AuthCtx.Provider>
  );
}

function Spinner() {
  return (
    <div style={{
      width:36, height:36, border:'3px solid #D8D3C5',
      borderTop:'3px solid #1B4332', borderRadius:'50%',
      animation:'spin 0.7s linear infinite',
    }}></div>
  );
}

function PrivateRoute({ children }) {
  const { user } = useContext(AuthCtx);
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useContext(AuthCtx);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse   { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/"          element={<Navigate to="/dashboard" replace />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/register"  element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/admin"     element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="*"          element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
