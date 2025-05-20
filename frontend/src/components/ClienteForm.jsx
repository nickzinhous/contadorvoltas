import { useState } from 'react';
import axios from 'axios';

export default function ClienteForm() {
  const [cliente, setCliente] = useState({
    nome: '',
    email: '',
    telefone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('https://contadorvoltas-production.up.railway.app/api/clientes', cliente);
      setSuccess(true);
      setCliente({ nome: '', email: '', telefone: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      alert('Erro ao cadastrar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="card-header">
        <h2 className="card-title">Cadastrar Novo Cliente</h2>
      </div>
      
      {success && (
        <div className="alert alert-success">
          Cliente cadastrado com sucesso!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nome completo</label>
          <input
            type="text"
            name="nome"
            className="form-control"
            value={cliente.nome}
            onChange={handleChange}
            required
            placeholder="Digite o nome do cliente"
          />
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={cliente.email}
              onChange={handleChange}
              placeholder="exemplo@email.com"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input
              type="tel"
              name="telefone"
              className="form-control"
              value={cliente.telefone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Cadastrando...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i> Cadastrar Cliente
            </>
          )}
        </button>
      </form>
    </div>
  );
}