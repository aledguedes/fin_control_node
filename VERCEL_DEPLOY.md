# Guia de Deploy na Vercel

Este documento contém instruções para fazer deploy do backend MyFinControl na Vercel.

## Pré-requisitos

1. Conta na Vercel (gratuita): https://vercel.com
2. Vercel CLI instalada (opcional, para deploy via CLI):
   ```bash
   npm i -g vercel
   ```

## Arquivos de Configuração

Os seguintes arquivos foram criados para suportar o deploy na Vercel:

- `vercel.json`: Configuração do projeto Vercel
- `api/index.ts`: Handler serverless que exporta o app Express
- `.vercelignore`: Arquivos ignorados no deploy
- `tsconfig.json`: Atualizado para incluir a pasta `api`

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel da Vercel (Settings > Environment Variables):

### Obrigatórias:

- `NODE_ENV`: `production`
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do Supabase
- `JWT_SECRET`: Chave secreta para assinatura de tokens JWT

### Opcionais:

- `ALLOWED_ORIGINS`: Lista de origens permitidas para CORS (separadas por vírgula)
  - Exemplo: `https://meuapp.vercel.app,https://www.meuapp.com`
- `ALLOW_ALL_ORIGINS`: `true` para permitir todas as origens (não recomendado em produção)
- `JWT_EXPIRES_IN`: Tempo de expiração do token (padrão: `24h`)
- `GOOGLE_CLIENT_ID`: Client ID do Google OAuth (se usar autenticação Google)

## Deploy via Dashboard da Vercel

1. Acesse https://vercel.com e faça login
2. Clique em "Add New Project"
3. Importe seu repositório Git (GitHub, GitLab ou Bitbucket)
4. Configure as variáveis de ambiente na seção "Environment Variables"
5. Clique em "Deploy"

A Vercel detectará automaticamente a configuração do `vercel.json` e fará o deploy.

## Deploy via CLI

1. **Login na Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy de preview (desenvolvimento):**
   ```bash
   vercel
   ```
   - Seguir prompts para conectar projeto
   - Escolher criar novo projeto ou linkar existente

3. **Configurar variáveis de ambiente via CLI:**
   ```bash
   vercel env add NODE_ENV
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add JWT_SECRET
   # Adicionar outras variáveis conforme necessário
   ```

4. **Deploy de produção:**
   ```bash
   vercel --prod
   ```

## Verificação do Deploy

Após o deploy, você pode verificar se está funcionando:

1. Acesse a URL fornecida pela Vercel (ex: `https://meu-projeto.vercel.app`)
2. Teste o health check: `https://meu-projeto.vercel.app/health`
3. Teste a documentação Swagger: `https://meu-projeto.vercel.app/api-docs`

## Endpoints Disponíveis

- `GET /health` - Health check
- `GET /api-docs` - Documentação Swagger
- `POST /api/v1/auth/register` - Registrar usuário
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/financial/transactions` - Listar transações
- `GET /api/v1/shopping/lists` - Listar listas de compras
- ... (veja CONFIGURACAO.md para lista completa)

## Considerações Importantes

- **Serverless**: A Vercel executa como serverless functions, não há servidor HTTP tradicional
- **Cold Start**: A primeira requisição pode ser mais lenta (~1-2s) devido ao cold start
- **Timeout**: Limite padrão de 10s para plano Hobby, 60s para Pro
- **CORS**: Configure `ALLOWED_ORIGINS` com a URL do seu frontend em produção
- **Logs**: Acesse os logs no dashboard da Vercel em "Deployments" > "Functions" > "View Function Logs"

## Troubleshooting

### Erro: "Cannot find module"
- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o build está funcionando localmente: `npm run build`

### Erro: "Environment variable not found"
- Verifique se todas as variáveis de ambiente obrigatórias estão configuradas
- Certifique-se de que as variáveis estão configuradas para o ambiente correto (Production, Preview, Development)

### Erro de CORS
- Configure `ALLOWED_ORIGINS` com a URL exata do seu frontend
- Verifique se o frontend está fazendo requisições para a URL correta da Vercel

### Timeout
- Verifique se há operações síncronas bloqueantes no código
- Considere otimizar queries ao banco de dados
- Upgrade para plano Pro se necessário (60s timeout)

