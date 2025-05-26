import { useEffect, useState } from 'react';
import axios from 'axios';
import GraficoEvolucao from './GraficoEvolucao';
import IndicadorMelhoria from './IndicadorMelhoria';

function parseNumber(value) {
  if (typeof value !== 'string') return 0;
  // Remove tudo que não é número, ponto ou vírgula
  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(',', '.').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export default function VoltasPorCliente() {
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [voltas, setVoltas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroSessao, setFiltroSessao] = useState('');

  useEffect(() => {
    axios
      .get('https://contadorvoltas-production.up.railway.app/api/clientes')
      .then(res => setClientes(res.data))
      .catch(() => setClientes([]));
  }, []);

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
      setVoltas(res.data);
    } catch (err) {
      console.error('Erro ao buscar voltas:', err);
      alert('Erro ao buscar voltas');
      setVoltas([]);
    } finally {
      setLoading(false);
    }
  };

  const voltasFiltradas = voltas.filter(v => {
    const dataVolta = new Date(v.data_registro);
    const dataInicioValida = filtroDataInicio ? dataVolta >= new Date(filtroDataInicio) : true;
    const dataFimValida = filtroDataFim ? dataVolta <= new Date(filtroDataFim) : true;
    const sessaoValida = !filtroSessao || String(v.sessao_paciente) === filtroSessao;
    return dataInicioValida && dataFimValida && sessaoValida;
  });

  // Ordenar as voltas do maior para o menor número de sessão (sessões recentes no topo)
  const voltasOrdenadas = [...voltasFiltradas].sort((a, b) => {
    const sa = Number(a.sessao_paciente);
    const sb = Number(b.sessao_paciente);
    if (!isNaN(sa) && !isNaN(sb)) return sb - sa;
    if (!isNaN(sa)) return -1;
    if (!isNaN(sb)) return 1;
    return 0;
  });

  return (
    <div className="voltas-section">
      <h2>Registro de Voltas por Paciente</h2>
    <br />
      <div className="cliente-selector" style={{ marginBottom: '1rem' }}>
        <select
          className="form-control"
          value={clienteSelecionado}
          onChange={e => setClienteSelecionado(e.target.value)}
        >
          <option value="">-- Selecione um Paciente --</option>
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
          style={{ marginLeft: '0.5rem' }}
        >
          {loading ? 'Buscando…' : 'Buscar Voltas'}
        </button>
      </div>

      {voltas.length > 0 && (
        <div className="filtros" style={{ marginBottom: '1rem' }}>
          <label>
            Data Início:&nbsp;
            <input
              type="date"
              value={filtroDataInicio}
              onChange={e => setFiltroDataInicio(e.target.value)}
            />
          </label>
          &nbsp;&nbsp;
          <label>
            Data Fim:&nbsp;
            <input
              type="date"
              value={filtroDataFim}
              onChange={e => setFiltroDataFim(e.target.value)}
            />
          </label>
          &nbsp;&nbsp;
          <label>
            Filtro por sessão:&nbsp;
            <input
              type="number"
              min="1"
              value={filtroSessao}
              onChange={e => setFiltroSessao(e.target.value)}
            />
          </label>
        </div>
      )}

      {voltasOrdenadas.length > 0 && (
        <div className="voltas-list">
          <div className="table-responsive">
            <table className="voltas-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Quantidade</th>
                  <th>Distância&nbsp;(m)</th>
                  <th>Tempo&nbsp;(s)</th>
                  <th>Tempo Médio Por Volta&nbsp;(s)</th>
                  <th>Sessão Paciente</th>
                </tr>
              </thead>
              <tbody>
                {voltasOrdenadas.map(volta => {
                  const qtd = Number(volta.quantidade_voltas) || 0;
                  const tempoSeg = parseNumber(volta.tempo_total);
                  const distancia = parseNumber(volta.distancia_total);
                  const tempoMedioSeg = qtd > 0 && tempoSeg > 0 ? (tempoSeg / qtd).toFixed(2) : '-';

                  return (
                    <tr key={volta.id}>
                      <td>{new Date(volta.data_registro).toLocaleString()}</td>
                      <td>{qtd > 0 ? qtd : '-'}</td>
                      <td>{distancia > 0 ? distancia : '-'}</td>
                      <td>{tempoSeg > 0 ? tempoSeg.toFixed(2) : '-'}</td>
                      <td>{tempoMedioSeg}</td>
                      <td>{volta.sessao_paciente ?? 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grafico-container" style={{ marginTop: '2rem' }}>
            <h3>Evolução por Sessão</h3>
            <GraficoEvolucao voltas={voltasFiltradas} /> {/* Usamos filtradas para respeitar filtros */}
          </div>

          <IndicadorMelhoria voltas={voltasFiltradas} />
        </div>
      )}
    </div>
  );
}
