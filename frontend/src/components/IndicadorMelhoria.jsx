export default function IndicadorMelhoria({ voltas }) {
  if (!voltas.length) return null;

  // Ordena as voltas por data
  const voltasOrdenadas = [...voltas].sort(
    (a, b) => new Date(a.data_registro) - new Date(b.data_registro)
  );

  const metade = Math.floor(voltasOrdenadas.length / 2);
  if (metade === 0) return null;

  const primeiraMetade = voltasOrdenadas.slice(0, metade);
  const segundaMetade = voltasOrdenadas.slice(metade);

  const calcularMediaTempoPorVolta = arr => {
    const temposTotais = arr.map(v => parseFloat(v.tempo_total));
    const quantidades = arr.map(v => parseFloat(v.quantidade_voltas));

    let somaTempos = 0;
    let somaVoltas = 0;

    for (let i = 0; i < arr.length; i++) {
      const tempo = temposTotais[i];
      const qtd = quantidades[i];
      if (!isNaN(tempo) && tempo > 0 && !isNaN(qtd) && qtd > 0) {
        somaTempos += tempo;
        somaVoltas += qtd;
      }
    }

    if (somaVoltas === 0) return null;
    return somaTempos / somaVoltas;
  };

  const mediaPrimeira = calcularMediaTempoPorVolta(primeiraMetade);
  const mediaSegunda = calcularMediaTempoPorVolta(segundaMetade);

  if (mediaPrimeira === null || mediaSegunda === null) return null;

  const diffPercent = ((mediaPrimeira - mediaSegunda) / mediaPrimeira) * 100;
  const melhorou = diffPercent > 0;

  return (
    <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>
      {melhorou ? (
        <span style={{ color: 'green' }}>
          ⬆️ Melhorou {diffPercent.toFixed(1)}% no tempo médio
        </span>
      ) : (
        <span style={{ color: 'red' }}>
          ⬇️ Piorou {Math.abs(diffPercent).toFixed(1)}% no tempo médio
        </span>
      )}
    </div>
  );
}
