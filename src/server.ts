import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import financialRoutes from './routes/financial';
import shoppingRoutes from './routes/shopping';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { databaseManager } from './config/database';
import { swaggerUi, swaggerSpec } from './config/swagger';

// Carregar variáveis de ambiente baseado no NODE_ENV
const envFile =
  process.env['NODE_ENV'] === 'production'
    ? '.env.production'
    : process.env['NODE_ENV'] === 'test'
    ? '.env.test'
    : '.env.development';
dotenv.config({ path: envFile });

const app = express();
const PORT = process.env['PORT'] || 3000;

// Obter configuração do banco de dados
const dbConfigInfo = databaseManager.getConfig();
console.log(
  `📊 Banco de dados: ${
    dbConfigInfo.type === 'sqlite'
      ? 'SQLite (Desenvolvimento)'
      : 'Supabase (Produção)'
  }`,
);

// Middlewares de segurança
app.use(helmet());
app.use(
  cors({
    // Durante testes, permitir qualquer origem. Usar função para refletir
    // o origin recebido (funciona com `credentials: true`). Em produção,
    // defina `FRONTEND_URL` no ambiente e remova/reforce essa opção.
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger de requisições
app.use(requestLogger);

// Rotas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/financial', financialRoutes);
app.use('/api/v1/shopping', shoppingRoutes);
// Também expor endpoints principais de shopping sem o prefixo "shopping/" para compatibilidade
app.use('/api/v1', shoppingRoutes);

// Documentação Swagger
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MyFinControl API Docs',
  }),
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

if (process.env['NODE_ENV'] !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env['NODE_ENV'] || 'development'}`);
  });
}

// Exportar instância do banco de dados para uso nas rotas
export const db = databaseManager.getDatabase();
export const dbConfig = databaseManager.getConfig();

export default app;
