import React from 'react';

const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const SunIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"/></svg>
);
export const HeartIcon = (p) => (
  <svg {...base} {...p}><path d="M12 20.5s-7.5-4.6-10-9.3C.5 8 2 4.5 5.4 4c2.2-.3 4 .9 6.6 3.8C14.6 4.9 16.4 3.7 18.6 4c3.4.5 4.9 4 3.4 7.2-2.5 4.7-10 9.3-10 9.3Z"/></svg>
);
export const MoonIcon = (p) => (
  <svg {...base} {...p}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>
);
export const SparkleIcon = (p) => (
  <svg {...base} {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7L19 17Z"/></svg>
);
export const MapIcon = (p) => (
  <svg {...base} {...p}><path d="M9 4 15 6l5-2v16l-5 2-6-2-5 2V6l5-2Z"/><path d="M9 4v16M15 6v16"/></svg>
);
export const CameraIcon = (p) => (
  <svg {...base} {...p}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v10A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5Z"/><circle cx="12" cy="13" r="3.2"/></svg>
);
export const UserIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6"/></svg>
);
export const PinIcon = (p) => (
  <svg {...base} {...p}><path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg>
);
export const PlusIcon = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>
);
export const LogoutIcon = (p) => (
  <svg {...base} {...p}><path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>
);
export const ChevronLeftIcon = (p) => (
  <svg {...base} {...p}><path d="M15 18l-6-6 6-6"/></svg>
);

export const ICONS_BY_KEY = {
  sun: SunIcon,
  heart: HeartIcon,
  moon: MoonIcon,
  sparkle: SparkleIcon
};
