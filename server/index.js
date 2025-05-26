import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

// Configurações do banco via variáveis de ambiente (Railway)

const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let db;

(async function initializeDatabase() {
  try {
    db = mysql.createPool(dbConfig);
    await db.getConnection(); // Testa conexão

    console.log('✅ Conectado ao banco de dados MySQL');

    // Criação/validação das tabelas
    await db.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefone VARCHAR(20),
        total_voltas INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS sessoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        data_inicio DATETIME NOT NULL,
        data_fim DATETIME,
        ativa BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS registros_voltas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        sessao_id INT,
        quantidade_voltas INT NOT NULL,
        distancia_total DECIMAL(10,2) NOT NULL,
        tempo_total VARCHAR(20) NOT NULL,
        data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sessao_paciente INT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (sessao_id) REFERENCES sessoes(id)
      )
    `);

    console.log('✅ Tabelas verificadas/criadas');
  } catch (err) {
    console.error('❌ Erro ao conectar/configurar o banco de dados:', err);
    process.exit(1);
  }
})();

// Middleware para garantir que o banco está conectado
app.use((req, res, next) => {
  if (!db) {
    return res.status(500).json({ error: 'Banco de dados não conectado' });
  }
  next();
});

// --- ROTAS ---

app.post('/api/clientes', async (req, res) => {
  const { nome, email, telefone } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

  try {
    const [result] = await db.query(
      'INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)',
      [nome, email || null, telefone || null]
    );
    res.status(201).json({ id: result.insertId, nome, email, telefone });
  } catch (err) {
    console.error('Erro ao criar cliente:', err);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    const [clientes] = await db.query(
      'SELECT id, nome, email, telefone, total_voltas FROM clientes ORDER BY nome'
    );
    res.json(clientes);
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

app.post('/api/sessoes', async (req, res) => {
  const { cliente_id } = req.body;
  if (!cliente_id) return res.status(400).json({ error: 'cliente_id é obrigatório' });

  try {
    const [cliente] = await db.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
    if (cliente.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });

    // Finaliza sessões ativas anteriores
    await db.query(
      'UPDATE sessoes SET ativa = false, data_fim = NOW() WHERE cliente_id = ? AND ativa = true',
      [cliente_id]
    );

    // Cria nova sessão ativa
    const [result] = await db.query(
      'INSERT INTO sessoes (cliente_id, data_inicio, ativa) VALUES (?, NOW(), true)',
      [cliente_id]
    );

    const [novaSessao] = await db.query('SELECT * FROM sessoes WHERE id = ?', [result.insertId]);

    res.status(201).json(novaSessao[0]);
  } catch (err) {
    console.error('Erro ao criar sessão:', err);
    res.status(500).json({ error: 'Erro ao criar sessão' });
  }
});

app.get('/api/sessoes', async (req, res) => {
  try {
    const { cliente_id } = req.query;

    let query = `
      SELECT s.id, s.cliente_id, c.nome as cliente_nome, 
             s.data_inicio, s.ativa 
      FROM sessoes s
      JOIN clientes c ON s.cliente_id = c.id
      WHERE s.ativa = true
    `;
    const params = [];

    if (cliente_id) {
      query += ' AND s.cliente_id = ?';
      params.push(cliente_id);
    }

    const [sessoes] = await db.query(query, params);
    res.json(sessoes);
  } catch (err) {
    console.error('Erro ao buscar sessões:', err);
    res.status(500).json({ error: 'Erro ao buscar sessões' });
  }
});

app.put('/api/sessoes/:id/desativar', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      'UPDATE sessoes SET ativa = false, data_fim = NOW() WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    res.json({ message: 'Sessão desativada com sucesso' });
  } catch (err) {
    console.error('Erro ao desativar sessão:', err);
    res.status(500).json({ error: 'Erro ao desativar sessão' });
  }
});

app.post('/api/voltas', async (req, res) => {
  const { cliente_id, quantidade_voltas, distancia_total, tempo_total } = req.body;

  if (!cliente_id || quantidade_voltas == null || distancia_total == null || tempo_total == null) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const [cliente] = await db.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
    if (cliente.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const [sessaoAtiva] = await db.query(
      'SELECT id FROM sessoes WHERE cliente_id = ? AND ativa = true LIMIT 1',
      [cliente_id]
    );
    const sessaoId = sessaoAtiva.length > 0 ? sessaoAtiva[0].id : null;

    const [sessaoPacienteMax] = await db.query(
      'SELECT MAX(sessao_paciente) AS max_sessao FROM registros_voltas WHERE cliente_id = ?',
      [cliente_id]
    );
    const novaSessaoPaciente = (sessaoPacienteMax[0].max_sessao || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO registros_voltas 
       (cliente_id, quantidade_voltas, distancia_total, tempo_total, sessao_id, sessao_paciente) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cliente_id, quantidade_voltas, distancia_total, tempo_total, sessaoId, novaSessaoPaciente]
    );

    await db.query(
      'UPDATE clientes SET total_voltas = COALESCE(total_voltas, 0) + ? WHERE id = ?',
      [quantidade_voltas, cliente_id]
    );

    res.status(201).json({
      id: result.insertId,
      cliente_id,
      quantidade_voltas,
      distancia_total,
      tempo_total,
      sessao_id: sessaoId,
      sessao_paciente: novaSessaoPaciente,
    });
  } catch (err) {
    console.error('Erro ao registrar voltas:', err);
    res.status(500).json({ error: 'Erro ao registrar voltas' });
  }
});

app.get('/api/voltas', async (req, res) => {
  try {
    const [voltas] = await db.query(`
      SELECT v.id, v.cliente_id, c.nome AS cliente_nome, v.sessao_id, s.data_inicio AS sessao_inicio,
             v.quantidade_voltas, v.distancia_total, v.tempo_total, v.data_registro, v.sessao_paciente
      FROM registros_voltas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN sessoes s ON v.sessao_id = s.id
      ORDER BY v.data_registro DESC
    `);
    res.json(voltas);
  } catch (err) {
    console.error('Erro ao buscar voltas:', err);
    res.status(500).json({ error: 'Erro ao buscar voltas' });
  }
});

app.get('/api/voltas/:cliente_id', async (req, res) => {
  const { cliente_id } = req.params;

  try {
    const [voltas] = await db.query(
      `SELECT v.id, v.quantidade_voltas, v.distancia_total, v.tempo_total, 
              v.data_registro, s.id as sessao_id, s.data_inicio as sessao_inicio,
              v.sessao_paciente
       FROM registros_voltas v
       LEFT JOIN sessoes s ON v.sessao_id = s.id
       WHERE v.cliente_id = ?
       ORDER BY v.data_registro DESC`,
      [cliente_id]
    );

    res.json(voltas);
  } catch (err) {
    console.error('Erro ao buscar voltas:', err);
    res.status(500).json({ error: 'Erro ao buscar voltas' });
  }
});

// Health check para saber se está rodando
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: db ? 'Conectado' : 'Desconectado',
    timestamp: new Date(),
  });
});

// Porta que Railway passa para rodar a app
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ouvindo na porta ${PORT}`);
});


// Captura erros não tratados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});