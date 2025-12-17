// IMPORTANTE: Carregar variáveis de ambiente ANTES de qualquer importação que dependa delas
import dotenv from 'dotenv';

const envFile =
  process.env['NODE_ENV'] === 'production'
    ? '.env.production'
    : process.env['NODE_ENV'] === 'test'
    ? '.env.test'
    : '.env.development';
dotenv.config({ path: envFile });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth';
import financialRoutes from './routes/financial';
import shoppingRoutes from './routes/shopping';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { databaseManager } from './config/database';
import { swaggerUi, swaggerSpec } from './config/swagger';

const app = express();
const PORT = process.env['PORT'] || 3000;

// Obter configuração do banco de dados
const dbConfigInfo = databaseManager.getConfig();
console.log(`📊 Banco de dados: Supabase`);

// Configuração de CORS
// Lista de origens permitidas (pode ser configurada via variável de ambiente)
const allowedOrigins = process.env['ALLOWED_ORIGINS']
  ? process.env['ALLOWED_ORIGINS'].split(',').map((origin) => origin.trim())
  : [
      'http://localhost:3000', // Backend (se necessário)
      'http://localhost:3300', // Frontend (porta alternativa)
      'http://localhost:4200', // Frontend Angular (desenvolvimento)
      'http://localhost:5173', // Frontend Vite (desenvolvimento)
      // Adicione outras URLs conforme necessário
    ];

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    // Permite requisições sem 'origin' (ex: Postman, apps mobile, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Se ALLOW_ALL_ORIGINS estiver definido como 'true', permite qualquer origem
    if (process.env['ALLOW_ALL_ORIGINS'] === 'true') {
      return callback(null, true);
    }

    // Em desenvolvimento, permite qualquer localhost com qualquer porta
    if (process.env['NODE_ENV'] === 'development') {
      const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
      if (localhostRegex.test(origin)) {
        return callback(null, true);
      }
    }

    // Verifica se a origem está na lista de permitidas
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(
        `⚠️  CORS bloqueou requisição de origem não permitida: ${origin}`,
      );
      callback(new Error('Not allowed by CORS'));
    }
  },
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
};

// Middlewares de segurança
app.use(helmet());
app.use(cors(corsOptions));

// Habilita o pre-flight para todas as rotas
app.options('*', cors(corsOptions));

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

// Não iniciar servidor HTTP quando executado na Vercel (serverless)
// A Vercel fornece a variável de ambiente VERCEL automaticamente
if (process.env['NODE_ENV'] !== 'test' && !process.env['VERCEL']) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env['NODE_ENV'] || 'development'}`);
  });
}

// Exportar instância do banco de dados para uso nas rotas
// export const db = databaseManager.getDatabase();
// export const dbConfig = databaseManager.getConfig();
// REMOVIDO: Acesso direto deve ser feito via DatabaseService ou importando databaseManager se necessário,
// mas o ideal é que o service encapsule isso. O DatabaseService original importava daqui.
// Como mudamos o DatabaseService para importar de config/database, não precisamos mais exportar aqui.

export default app;
