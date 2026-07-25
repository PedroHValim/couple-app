import React from 'react';
import { NavLink } from 'react-router-dom';
import { PinIcon, MapIcon, UserIcon } from './Icons';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <PinIcon />
        Início
      </NavLink>
      <NavLink to="/viagens" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <MapIcon />
        Viagens
      </NavLink>
      <NavLink to="/perfil" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <UserIcon />
        Perfil
      </NavLink>
    </nav>
  );
}
