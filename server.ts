import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3306,
    // Se DB_SSL for true, usa SSL. Caso contrário, não força.
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true
  });

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
    } catch (err: any) {
      console.error('❌ Erro na inicialização do banco:', err.message);
    }
  };

  await initDb();

  // Endpoint de diagnóstico
  app.get('/api/admin/debug', (req, res) => {
    res.json({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL,
      passLength: process.env.DB_PASS?.length || 0,
      client_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });
  });

  // API Routes
  app.get('/api/admin/tenants', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
      res.json(rows);
    } catch (err: any) {
      console.error('Database detailed error:', err);
      res.status(500).json({ error: 'Erro no banco de dados' });
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

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Modo: Desenvolvimento (Vite Middleware)');
  } else {
    // Para produção na Hostinger ou outros ambientes
    const distPath = path.resolve(__dirname, 'dist');
    
    // Verifica se a pasta dist existe
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Erro ao enviar index.html:', err);
          res.status(500).send('Erro no servidor: Pasta "dist" não encontrada ou vazia. Certifique-se de rodar "npm run build" antes de subir para a Hostinger.');
        }
      });
    });
    console.log(`Modo: Produção (Servindo arquivos de: ${distPath})`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Super Admin rodando na ${PORT}`);
  });
}

startServer();
