// Handler serverless para Vercel
// Importa o app Express configurado em server.ts
// A Vercel compilará o TypeScript automaticamente
import app from '../src/server';

// Exporta o handler para a Vercel
export default app;

