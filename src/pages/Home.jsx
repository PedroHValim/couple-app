import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { useLocationSync } from '../lib/useLocationSync';
import { useCoupleLocations } from '../lib/useCoupleLocations';
import { useIncomingMessages } from '../lib/useIncomingMessages';
import { usePushSubscription } from '../lib/usePushSubscription';
import { avatarDivIcon } from '../components/AvatarMarker';
import MessageButtons from '../components/MessageButtons';
import { QUICK_MESSAGES } from '../lib/messages';
import { BellIcon, CloseIcon, ICONS_BY_KEY } from '../components/Icons';
import FallingHearts from '../components/FallingHearts';
import '../components/mapMarkers.css';

const LAST_SEEN_KEY = 'nossa-orbita-last-seen-msg';

const FALLBACK_CENTER = [-23.5505, -46.6333]; // São Paulo, usado só se ninguém tiver localização ainda

function Recenter({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(points, { padding: [60, 60], maxZoom: 15 });
    }
  }, [JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function Home() {
  const { session, profile, partner } = useAuth();
  const myId = session?.user?.id;
  const locStatus = useLocationSync(myId);
  const locations = useCoupleLocations(myId, partner?.id);
  const incoming = useIncomingMessages(myId);
  const { state: pushState, enable: enablePush } = usePushSubscription(myId);
  const [toast, setToast] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(null);
  const [lastSeenId, setLastSeenId] = useState(() => localStorage.getItem(LAST_SEEN_KEY));

  useEffect(() => {
    if (incoming) {
      setToast(incoming.body);
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [incoming]);

  const hasUnread = !!incoming && incoming.id !== lastSeenId;

  async function openHistory() {
    setShowHistory(true);
    if (incoming) {
      localStorage.setItem(LAST_SEEN_KEY, incoming.id);
      setLastSeenId(incoming.id);
    }
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', myId)
      .order('created_at', { ascending: false })
      .limit(50);
    setHistory(data || []);
  }

  const mePoint = locations[myId] ? [locations[myId].lat, locations[myId].lng] : null;
  const partnerPoint = locations[partner?.id] ? [locations[partner.id].lat, locations[partner.id].lng] : null;
  const points = useMemo(() => [mePoint, partnerPoint].filter(Boolean), [mePoint, partnerPoint]);

  const daysTogether = getDaysTogether(profile?.anniversary_date);
  const isAnniversary = isAnniversaryToday(profile?.anniversary_date);

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p className="eyebrow">nossa órbita</p>
          <h1 style={{ fontSize: 24, marginTop: 4 }}>Onde vocês estão</h1>
        </div>
        <button
          onClick={openHistory}
          style={{ position: 'relative', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, padding: 10, display: 'flex' }}
        >
          <BellIcon width={20} height={20} />
          {hasUnread && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--dawn)' }} />
          )}
        </button>
      </div>

      {locStatus === 'denied' && (
        <Banner text="Ative a permissão de localização nas configurações do navegador para aparecer no mapa." />
      )}
      {pushState === 'idle' && (
        <Banner
          text="Ative as notificações para receber as mensagens do seu par mesmo com o app fechado."
          action={{ label: 'Ativar', onClick: enablePush }}
        />
      )}

      <div style={{ height: 340, margin: '0 20px 16px', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 0 }}>
        <MapContainer center={points[0] || FALLBACK_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter points={points} />
          {mePoint && (
            <Marker position={mePoint} icon={avatarDivIcon({ avatarUrl: profile?.avatar_url, name: profile?.name, borderColor: '#F4C95D' })}>
              <Popup>Você — {formatUpdated(locations[myId]?.updated_at)}</Popup>
            </Marker>
          )}
          {partnerPoint && (
            <Marker position={partnerPoint} icon={avatarDivIcon({ avatarUrl: partner?.avatar_url, name: partner?.name, borderColor: '#9B94E0' })}>
              <Popup>{partner?.name} — {formatUpdated(locations[partner.id]?.updated_at)}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <MessageButtons myId={myId} partnerId={partner?.id} />

      {daysTogether != null && (
        <div
          className="card"
          style={{
            margin: '16px 20px 0',
            textAlign: 'center',
            ...(isAnniversary ? { border: '1px solid var(--gold)', background: 'rgba(244,201,93,0.14)' } : {})
          }}
        >
          {isAnniversary ? (
            <>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>🎉 Feliz aniversário de namoro! 🎉</p>
              <p className="eyebrow" style={{ marginTop: 6 }}>{daysTogether} dias juntos</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)' }}>{daysTogether}</p>
              <p className="eyebrow">dias juntos</p>
            </>
          )}
        </div>
      )}

      {isAnniversary && <FallingHearts />}

      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,20,43,0.95)', border: '1px solid rgba(244,201,93,0.4)',
          padding: '12px 18px', borderRadius: 14, maxWidth: 320, zIndex: 100,
          fontSize: 14, textAlign: 'center'
        }}>
          {partner?.name} disse: {toast}
        </div>
      )}

      {showHistory && (
        <div
          onClick={() => setShowHistory(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6,6,16,0.88)', display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '70vh',
              overflowY: 'auto',
              borderRadius: '20px 20px 0 0',
              padding: 20,
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
              background: 'var(--night-2)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 17 }}>Mensagens de {partner?.name}</h3>
              <button
                onClick={() => setShowHistory(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 999, padding: 6, display: 'flex' }}
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>

            {history === null && <p style={{ color: 'var(--muted)' }}>Carregando…</p>}
            {history?.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Nenhuma mensagem recebida ainda.</p>}
            {history?.map((m) => {
              const Icon = ICONS_BY_KEY[QUICK_MESSAGES[m.type]?.icon];
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {Icon && <Icon width={20} height={20} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14 }}>{m.body}</p>
                    <p className="eyebrow" style={{ marginTop: 2 }}>{formatUpdated(m.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Banner({ text, action }) {
  return (
    <div style={{ margin: '0 20px 12px', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,180,162,0.12)', border: '1px solid rgba(255,180,162,0.25)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--cream)' }}>
      <span style={{ flex: 1 }}>{text}</span>
      {action && <button className="btn btn-outline" style={{ padding: '8px 12px', fontSize: 12 }} onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

function getDaysTogether(anniversaryDate) {
  if (!anniversaryDate) return null;
  const start = new Date(anniversaryDate + 'T00:00:00');
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - start) / 86400000);
  return diff >= 0 ? diff : null;
}

function isAnniversaryToday(anniversaryDate) {
  if (!anniversaryDate) return false;
  const start = new Date(anniversaryDate + 'T00:00:00');
  const today = new Date();
  return (
    today.getMonth() === start.getMonth() &&
    today.getDate() === start.getDate() &&
    today.getFullYear() > start.getFullYear()
  );
}

function formatUpdated(iso) {
  if (!iso) return '';
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  return `há ${Math.round(diffMin / 60)}h`;
}
