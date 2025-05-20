import { useState } from 'react';
import './App.css';
import ClienteForm from './components/ClienteForm';
import ClienteList from './components/ClienteList';
import SessaoPorCliente from './components/SessaoPorCliente';
import VoltasPorCliente from './components/VoltasPorCliente';

function App() {
  const [activeTab, setActiveTab] = useState('clientes');

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          Controle <span>Voltas</span>
        </div>
        <nav className="tabs">
          <button 
            className={activeTab === 'clientes' ? 'active' : ''}
            onClick={() => setActiveTab('clientes')}
          >
            <i className="fas fa-users"></i> Clientes
          </button>
          <button 
            className={activeTab === 'sessoes' ? 'active' : ''}
            onClick={() => setActiveTab('sessoes')}
          >
            <i className="fas fa-stopwatch"></i> Sessões
          </button>
          <button 
            className={activeTab === 'voltas' ? 'active' : ''}
            onClick={() => setActiveTab('voltas')}
          >
            <i className="fas fa-running"></i> Voltas
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'clientes' && (
          <div className="grid-container">
            <div className="card">
              <ClienteForm />
            </div>
            <div className="card">
              <ClienteList />
            </div>
          </div>
        )}
        
        {activeTab === 'sessoes' && (
          <div className="card">
            <SessaoPorCliente />
          </div>
        )}
        
        {activeTab === 'voltas' && (
          <div className="card">
            <VoltasPorCliente />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;