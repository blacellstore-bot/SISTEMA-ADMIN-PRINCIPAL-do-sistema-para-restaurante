import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante que o .env seja lido do mesmo diretório que o server.js
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true
  });

  // Teste de conexão simples para o Log
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexão com o banco de dados OK');
    connection.release();
  } catch (err) {
    console.error('❌ Falha na conexão com o banco:', err.message);
  }

  // Inicialização do Banco (Cria a tabela se não existir)
  const initDb = async () => {
    try {
      console.log(`Tentando conectar ao banco: ${process.env.DB_USER}@${process.env.DB_HOST}`);
      // Adicionando email, admin_name e password se não existirem
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          email VARCHAR(255),
          password VARCHAR(255),
          admin_name VARCHAR(255),
          whatsapp VARCHAR(255),
          active TINYINT(1) DEFAULT 1,
          subscription_status VARCHAR(50),
          trial_ends_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Adicionando colunas novas se não existirem
      try { await pool.query('ALTER TABLE tenants ADD COLUMN email VARCHAR(255)'); } catch(e) {}
      try { await pool.query('ALTER TABLE tenants ADD COLUMN admin_name VARCHAR(255)'); } catch(e) {}
      try { await pool.query('ALTER TABLE tenants ADD COLUMN password VARCHAR(255)'); } catch(e) {}
      try { await pool.query('ALTER TABLE tenants ADD COLUMN permissions TEXT'); } catch(e) {}
      
      console.log('✅ Tabela "tenants" verificada/atualizada com sucesso.');
    } catch (err) {
      console.error('❌ Erro na inicialização do banco:', err.message);
    }
  };

  await initDb();

  // Endpoint de diagnóstico
  app.get('/api/admin/debug', async (req, res) => {
    const info = {
      db_host: process.env.DB_HOST,
      db_user: process.env.DB_USER,
      db_name: process.env.DB_NAME,
      pass_len: process.env.DB_PASS ? process.env.DB_PASS.length : 0,
      server_time: new Date().toISOString(),
      client_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    };
    
    try {
      const [result] = await pool.query('SELECT 1 as verified');
      res.json({ status: 'SUCCESS', message: 'Conectado ao MySQL!', info, result });
    } catch (err) {
      res.status(500).json({ status: 'ERROR', message: err.message, code: err.code, info });
    }
  });

  // API Routes
  app.get('/api/admin/tenants', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
      res.json(rows);
    } catch (err) {
      console.error('Database detailed error:', err);
      res.status(500).json({ 
        error: 'Erro no banco de dados',
        details: err.message,
        code: err.code,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });
    }
  });

  app.put('/api/admin/tenants/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, password, admin_name, whatsapp, active, subscription_status, trial_ends_at, permissions } = req.body;
    try {
      await pool.query(
        'UPDATE tenants SET name = ?, email = ?, password = ?, admin_name = ?, whatsapp = ?, active = ?, subscription_status = ?, trial_ends_at = ?, permissions = ? WHERE id = ?',
        [name, email, password, admin_name, whatsapp, active ? 1 : 0, subscription_status, trial_ends_at, JSON.stringify(permissions), id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Update error:', err);
      res.status(500).json({ error: 'Erro ao atualizar' });
    }
  });

  // Estáticos (Produção)
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();
