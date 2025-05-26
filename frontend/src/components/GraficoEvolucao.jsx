import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function parseNumber(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return 0;
  const str = String(value).replace(/[^0-9.,-]/g, '').replace(',', '.').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export default function GraficoEvolucao({ voltas }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!voltas || voltas.length === 0) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Agrupa dados por sessão
    const dadosPorSessao = {};
    voltas.forEach(v => {
      const sessao = v.sessao_paciente ?? 'N/A';

      if (!dadosPorSessao[sessao]) {
        dadosPorSessao[sessao] = { tempo: 0, distancia: 0, voltas: 0 };
      }

      const tempo = parseNumber(v.tempo_total);
      const distancia = parseNumber(v.distancia_total);
      const qtd = parseNumber(v.quantidade_voltas);

      dadosPorSessao[sessao].tempo += tempo;
      dadosPorSessao[sessao].distancia += distancia;
      dadosPorSessao[sessao].voltas += qtd;
    });

    const sessoes = Object.keys(dadosPorSessao).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb; // numérico crescente
    if (!isNaN(na)) return -1;
    if (!isNaN(nb)) return 1;
    return a.localeCompare(b); // ordem alfabética
    });


    const temposTotais = sessoes.map(s => dadosPorSessao[s].tempo);
    const distanciasTotais = sessoes.map(s => dadosPorSessao[s].distancia);
    const temposMedios = sessoes.map(s => {
      const d = dadosPorSessao[s];
      return d.voltas > 0 ? d.tempo / d.voltas : 0;
    });

    if (canvasRef.current.chartInstance) {
      canvasRef.current.chartInstance.destroy();
    }

    const chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sessoes.map(s => `Sessão ${s}`),
        datasets: [
          {
            type: 'line',
            label: 'Tempo Total (s)',
            data: temposTotais,
            borderColor: 'blue',
            backgroundColor: 'rgba(0, 0, 255, 0.2)',
            yAxisID: 'y1',
            tension: 0.4,
          },
          {
            type: 'bar',
            label: 'Distância Total (m)',
            data: distanciasTotais,
            backgroundColor: 'rgba(0, 255, 0, 0.5)',
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Tempo Médio por Volta (s)',
            data: temposMedios,
            borderColor: 'orange',
            backgroundColor: 'rgba(255, 165, 0, 0.2)',
            borderDash: [5, 5],
            yAxisID: 'y1',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        stacked: false,
        plugins: {
          title: { display: true, text: 'Evolução por Sessão' },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}`,
            },
          },
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Distância (m)' },
            beginAtZero: true,
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Tempo (s)' },
            grid: { drawOnChartArea: false },
            beginAtZero: true,
          },
        },
      },
    });

    canvasRef.current.chartInstance = chartInstance;

    return () => {
      chartInstance.destroy();
    };
  }, [voltas]);

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
}
