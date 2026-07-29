import React from 'react';
import { displayAvatarUrl, isFullBodyAvatar } from '../lib/dicebear';

// Distância em linha reta entre 2 pontos [lat, lng], em km (fórmula de haversine).
function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(km) {
  if (km < 1) return `${Math.max(0, Math.round(km * 1000))} m`;
  return `${km.toFixed(1)} km`;
}

// Avatar de corpo inteiro: uma foto/PNG normal que a pessoa subiu (ex: um avatar
// 3D exportado de algum criador tipo Avaturn), mostrada sem cortar em círculo.
function FullBodyFigure({ person, lean }) {
  return (
    <img
      src={person.avatar_url}
      alt=""
      style={{
        height: 150, width: 'auto',
        filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.35))',
        transition: 'transform 0.6s ease',
        transform: lean ? `rotate(${lean}deg)` : 'none'
      }}
    />
  );
}

// Avatar redondo (foto real ou desenho DiceBear).
function RoundFigure({ url, name, borderColor, lean }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: 84, height: 84, borderRadius: '50%',
        border: `3px solid ${borderColor}`,
        backgroundColor: 'var(--night-3)',
        backgroundImage: url ? `url(${url})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, fontWeight: 800, color: 'var(--cream)',
        flexShrink: 0, boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
        transition: 'margin 0.6s ease, transform 0.6s ease',
        transform: lean ? `rotate(${lean}deg)` : 'none'
      }}
    >
      {!url && initial}
    </div>
  );
}

function Figure({ person, borderColor, lean }) {
  if (isFullBodyAvatar(person)) {
    return <FullBodyFigure person={person} lean={lean} />;
  }
  return <RoundFigure url={displayAvatarUrl(person)} name={person?.name} borderColor={borderColor} lean={lean} />;
}

// Uma "cena" bem simples com os avatares dos dois: eles se aproximam conforme
// a distância real diminui, e ficam coladas com um coração quando estão pertinho.
export default function ProximityWidget({ me, partner, mePoint, partnerPoint }) {
  const distanceKm = mePoint && partnerPoint ? haversineKm(mePoint, partnerPoint) : null;
  const together = distanceKm != null && distanceKm < 0.05; // menos de 50m = "juntos"
  const anyFullBody = isFullBodyAvatar(me) || isFullBodyAvatar(partner);
  const baseGap = distanceKm == null ? 60 : Math.min(110, 24 + distanceKm * 26);
  const togetherGap = anyFullBody ? -34 : -18;
  const gap = together ? togetherGap : baseGap;

  return (
    <div className="card" style={{ margin: '0 20px 16px', padding: '28px 16px', textAlign: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap, marginBottom: 16 }}>
        <Figure person={me} borderColor="var(--gold)" lean={together ? 8 : 0} />
        {together && (
          <span style={{ position: 'absolute', top: -12, fontSize: 26, animation: 'heart-pop 1.4s ease-in-out infinite' }}>💛</span>
        )}
        <Figure person={partner} borderColor="var(--lavender)" lean={together ? -8 : 0} />
      </div>

      {distanceKm == null ? (
        <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>Esperando a localização dos dois…</p>
      ) : together ? (
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>Vocês estão juntos! 💛</p>
      ) : (
        <>
          <p style={{ fontSize: 22, fontWeight: 800 }}>{formatDistance(distanceKm)}</p>
          <p className="eyebrow" style={{ marginTop: 2 }}>de distância</p>
        </>
      )}
    </div>
  );
}
