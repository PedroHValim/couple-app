import L from 'leaflet';

// Cria um ícone de marcador circular com a foto de perfil da pessoa e uma cor de borda.
export function avatarDivIcon({ avatarUrl, name, borderColor }) {
  const initials = (name || '?').trim().charAt(0).toUpperCase();
  const inner = avatarUrl
    ? `<img src="${avatarUrl}" alt="${name || ''}" />`
    : `<span>${initials}</span>`;

  const html = `
    <div class="avatar-pin" style="--pin-color:${borderColor}">
      <div class="avatar-pin-photo">${inner}</div>
      <div class="avatar-pin-tail"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'avatar-pin-wrapper',
    iconSize: [46, 56],
    iconAnchor: [23, 54],
    popupAnchor: [0, -50]
  });
}
