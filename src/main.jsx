import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// HashRouter (em vez de BrowserRouter) porque o GitHub Pages é hospedagem estática:
// ele não sabe redirecionar /viagens para dentro do app ao recarregar a página.
// Com HashRouter as rotas viram /#/viagens, que o navegador sempre resolve sozinho.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
