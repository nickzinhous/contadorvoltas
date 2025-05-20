import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SessaoPorCliente() {
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [sessaoId, setSessaoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessoesAtivas, setSessoesAtivas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, sessoesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/clientes'),
          axios.get('http://localhost:5000/api/sessoes')
        ]);
        setClientes(clientesRes.data);
        setSessoesAtivas(sessoesRes.data);
      } catch (err) {
        setError('Erro ao carregar dados. Tente recarregar a página.');
        console.error(err);
      }
    };
    
    fetchData();
  }, []);

  const criarSessao = async () => {
    if (!clienteSelecionado) {
      setError('Selecione um cliente antes de criar a sessão.');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5000/api/sessoes', {
        cliente_id: clienteSelecionado
      });
      
      setSessaoId(res.data.id);
      const response = await axios.get('http://localhost:5000/api/sessoes');
      setSessoesAtivas(response.data);
    } catch (err) {
      console.error('Erro ao criar sessão:', err);
      setError(err.response?.data?.message || 'Erro ao criar sessão');
    } finally {
      setLoading(false);
    }
  };

  const encerrarSessao = async (sessaoId) => {
    if (!window.confirm('Tem certeza que deseja encerrar esta sessão?')) return;
    
    try {
      await axios.put(`http://localhost:5000/api/sessoes/${sessaoId}/desativar`);
      const response = await axios.get('http://localhost:5000/api/sessoes');
      setSessoesAtivas(response.data);
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
      setError('Erro ao encerrar sessão');
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="voltas-section">
      <div className="card-header">
        <h2 className="card-title">Gerenciamento de Sessões</h2>
      </div>
      
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Selecione um cliente:</label>
          <select 
            className="form-control"
            value={clienteSelecionado} 
            onChange={e => setClienteSelecionado(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Selecione um cliente --</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome} (ID: {c.id})</option>
            ))}
          </select>
        </div>
        
        <div className="form-group" style={{ alignSelf: 'flex-end' }}>
          <button 
            onClick={criarSessao} 
            disabled={loading || !clienteSelecionado}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Criando...
              </>
            ) : 'Criar Nova Sessão'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {sessaoId && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>
            <p><strong>Sessão criada com sucesso!</strong></p>
            <p>ID da Sessão: <span className="sessao-badge">{sessaoId}</span></p>
          </div>
        </div>
      )}

      <div className="mt-3">
        <h3 className="card-title">Sessões Ativas</h3>
        
        {sessoesAtivas.length === 0 ? (
          <div className="text-center text-muted py-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>Nenhuma sessão ativa no momento</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Sessão</th>
                  <th>Cliente</th>
                  <th>Início</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sessoesAtivas.map(sessao => (
                  <tr key={sessao.id}>
                    <td><span className="sessao-badge">{sessao.id}</span></td>
                    <td>
                      <strong>{sessao.cliente_nome}</strong>
                      <div className="text-muted">ID: {sessao.cliente_id}</div>
                    </td>
                    <td>{formatarData(sessao.data_inicio)}</td>
                    <td>
                      <button 
                        onClick={() => encerrarSessao(sessao.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Encerrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}