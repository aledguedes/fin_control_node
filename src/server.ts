import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import authRoutes from './routes/auth';
import financialRoutes from './routes/financial.js';
import shoppingRoutes from './routes/shopping.js';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3000;

// Configuração do Supabase
export const supabase = createClient(
  process.env['SUPABASE_URL'] || '',
  process.env['SUPABASE_SERVICE_ROLE'] || '',
);

// Middlewares de segurança
app.use(helmet());
app.use(
  cors({
    origin: process.env['FRONTEND_URL'] || '*',
    credentials: true,
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env['NODE_ENV'] || 'development'}`);
});

export default app;
