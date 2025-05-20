// VoltasPorCliente.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function VoltasPorCliente() {
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [voltas, setVoltas] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------- carrega lista de clientes ---------- */
  useEffect(() => {
    axios
      .get('https://contadorvoltas-production.up.railway.app/api/clientes')
      .then(res => setClientes(res.data))
      .catch(() => setClientes([]));
  }, []);

  /* ---------- busca voltas do cliente ---------- */
  const buscarVoltas = async () => {
    if (!clienteSelecionado) {
      alert('Selecione um cliente antes de buscar as voltas.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `https://contadorvoltas-production.up.railway.app/api/voltas/${clienteSelecionado}`
      );
      console.log('Voltas recebidas:', res.data); // Log para verificar os dados recebidos
      setVoltas(res.data);
    } catch (err) {
      console.error('Erro ao buscar voltas:', err);
      alert('Erro ao buscar voltas');
      setVoltas([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="voltas-section">
      <h2>Registro de Voltas por Cliente</h2>

      {/* seletor + botão ------------------------------------------------ */}
      <div className="cliente-selector">
        <select
          className="form-control"
          value={clienteSelecionado}
          onChange={e => setClienteSelecionado(e.target.value)}
        >
          <option value="">-- Selecione um cliente --</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nome} (ID: {c.id})
            </option>
          ))}
        </select>

        <button
          className="btn btn-primary"
          onClick={buscarVoltas}
          disabled={loading || !clienteSelecionado}
        >
          {loading ? 'Buscando…' : 'Buscar Voltas'}
        </button>
      </div>

      {/* tabela --------------------------------------------------------- */}
      {voltas.length > 0 && (
        <div className="voltas-list">
          <h3>Voltas registradas para o cliente selecionado</h3>

          <div className="table-responsive">
            <table className="voltas-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Quantidade</th>
                  <th>Distância&nbsp;(m)</th>
                  <th>Tempo&nbsp;(s)</th>
                  <th>Sessão Paciente</th> {/* mantém só essa coluna */}
                </tr>
              </thead>
              <tbody>
                {voltas.map(volta => (
                  <tr key={volta.id}>
                    <td>{new Date(volta.data_registro).toLocaleString()}</td>
                    <td>{volta.quantidade_voltas}</td>
                    <td>{volta.distancia_total}</td>
                    <td>{volta.tempo_total}</td>
                    <td>
                      {volta.sessao_paciente !== null && volta.sessao_paciente !== undefined
                        ? volta.sessao_paciente
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
