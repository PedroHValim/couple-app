import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// HashRouter (em vez de BrowserRouter) porque o GitHub Pages é hospedagem estática:
// ele não sabe redirecionar /viagens para dentro do app ao recarregar a página.
// Com HashRouter as rotas viram /#/viagens, que o navegador sempre resolve sozinho.
// O app é um PWA: o service worker guarda a versão anterior pra funcionar
// offline, então sem isso um deploy novo só aparece depois de fechar e abrir
// o app várias vezes (ou nem aparece, se ele ficar aberto em segundo plano).
// Aqui: pede pro navegador conferir se saiu versão nova sempre que o app volta
// pro primeiro plano, e recarrega uma vez quando a nova assume o controle.
if ('serviceWorker' in navigator) {
  // Se não havia controlador, é a primeira visita — o "controllerchange" é só
  // o service worker estreando, não uma atualização, e recarregar seria inútil.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  const checkForUpdate = () => {
    if (document.visibilityState !== 'visible') return;
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
  };
  document.addEventListener('visibilitychange', checkForUpdate);
  window.addEventListener('load', checkForUpdate);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
