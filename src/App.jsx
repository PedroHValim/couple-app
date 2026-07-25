import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Pairing from './pages/Pairing';
import Home from './pages/Home';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import Profile from './pages/Profile';

function Gate({ children }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="app-shell center-col" style={{ minHeight: '100dvh' }}>
      <p className="eyebrow">carregando…</p>
    </div>;
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!profile?.partner_id) return <Navigate to="/pairing" replace />;
  return children;
}

function Shell() {
  const { session, profile } = useAuth();
  const showNav = session && profile?.partner_id;

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/pairing" element={<Pairing />} />
        <Route path="/" element={<Gate><Home /></Gate>} />
        <Route path="/viagens" element={<Gate><Trips /></Gate>} />
        <Route path="/viagens/:tripId" element={<Gate><TripDetail /></Gate>} />
        <Route path="/perfil" element={<Gate><Profile /></Gate>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
