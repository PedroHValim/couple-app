import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { useTheme } from './lib/useTheme';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Pairing from './pages/Pairing';
import Home from './pages/Home';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import Movies from './pages/Movies';
import Games from './pages/Games';
import TicTacToe from './pages/games/TicTacToe';
import RockPaperScissors from './pages/games/RockPaperScissors';
import ConnectFour from './pages/games/ConnectFour';
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
  useTheme();

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/pairing" element={<Pairing />} />
        <Route path="/" element={<Gate><Home /></Gate>} />
        <Route path="/viagens" element={<Gate><Trips /></Gate>} />
        <Route path="/viagens/:tripId" element={<Gate><TripDetail /></Gate>} />
        <Route path="/filmes" element={<Gate><Movies /></Gate>} />
        <Route path="/jogos" element={<Gate><Games /></Gate>} />
        <Route path="/jogos/velha" element={<Gate><TicTacToe /></Gate>} />
        <Route path="/jogos/ppt" element={<Gate><RockPaperScissors /></Gate>} />
        <Route path="/jogos/lig4" element={<Gate><ConnectFour /></Gate>} />
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
