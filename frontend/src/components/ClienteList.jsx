import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ClienteList() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await axios.get('https://contadorvoltas-production.up.railway.app/api/clientes');
        setClientes(response.data);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        alert('Erro ao carregar clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone?.includes(searchTerm)
  );

  if (loading) return <div className="text-center mt-3"><i className="fas fa-spinner fa-spin"></i> Carregando Pacientes...</div>;

  return (
    <div className="clientes-list">
      <div className="card-header">
        <h2 className="card-title">Lista de Pacientes</h2>
        <div className="form-group" style={{ width: '300px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar Pacientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Contato</th>
              <th>Total Voltas</th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.length > 0 ? (
              filteredClientes.map(cliente => (
                <tr key={cliente.id}>
                  <td>{cliente.id}</td>
                  <td>
                    <strong>{cliente.nome}</strong>
                  </td>
                  <td>
                    {cliente.email && <div><i className="fas fa-envelope"></i> {cliente.email}</div>}
                    {cliente.telefone && <div><i className="fas fa-phone"></i> {cliente.telefone}</div>}
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      backgroundColor: '#e6f7ee', 
                      color: '#0a8150',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '600'
                    }}>
                      {cliente.total_voltas || 0}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center text-muted">
                  Nenhum Paciente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}