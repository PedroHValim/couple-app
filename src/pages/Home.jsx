import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useAuth } from '../lib/AuthContext';
import { useLocationSync } from '../lib/useLocationSync';
import { useCoupleLocations } from '../lib/useCoupleLocations';
import { useIncomingMessages } from '../lib/useIncomingMessages';
import { usePushSubscription } from '../lib/usePushSubscription';
import { avatarDivIcon } from '../components/AvatarMarker';
import MessageButtons from '../components/MessageButtons';
import '../components/mapMarkers.css';

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

  useEffect(() => {
    if (incoming) {
      setToast(incoming.body);
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [incoming]);

  const mePoint = locations[myId] ? [locations[myId].lat, locations[myId].lng] : null;
  const partnerPoint = locations[partner?.id] ? [locations[partner.id].lat, locations[partner.id].lng] : null;
  const points = useMemo(() => [mePoint, partnerPoint].filter(Boolean), [mePoint, partnerPoint]);

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <p className="eyebrow">nossa órbita</p>
        <h1 style={{ fontSize: 24, marginTop: 4 }}>Onde vocês estão</h1>
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

      <div style={{ height: 340, margin: '0 20px 16px', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
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

function formatUpdated(iso) {
  if (!iso) return '';
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  return `há ${Math.round(diffMin / 60)}h`;
}
