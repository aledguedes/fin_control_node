# MyFinControl Backend - Documentação de Configuração

## Configuração do Supabase

Para configurar o banco de dados com Supabase, siga estes passos:

### 1. Criar conta no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Crie um novo projeto
4. Anote a URL do projeto e as chaves de API

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Preencha as variáveis com as informações do seu projeto Supabase:

- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_ANON_KEY`: Chave anon (para uso futuro no frontend)
- `SUPABASE_SERVICE_ROLE`: Service Role Key (para uso no backend)

### 3. Executar migrations

As migrations estão localizadas em `supabase/migrations/`. Você pode executá-las:

1. Através do dashboard do Supabase
2. Usando a CLI do Supabase
3. Manualmente através do SQL Editor

### 4. Configurar permissões

As migrations já incluem as configurações de Row Level Security (RLS) e permissões necessárias.

## Endpoints da API

### Autenticação

- `POST /api/v1/auth/register` - Registrar novo usuário
- `POST /api/v1/auth/login` - Fazer login

### Financeiro

- `GET /api/v1/financial/transactions` - Listar transações
- `POST /api/v1/financial/transactions` - Criar transação
- `PUT /api/v1/financial/transactions/:id` - Atualizar transação
- `DELETE /api/v1/financial/transactions/:id` - Excluir transação
- `GET /api/v1/financial/categories` - Listar categorias
- `POST /api/v1/financial/categories` - Criar categoria
- `GET /api/v1/financial/summary/monthly-view` - Visão mensal
- `GET /api/v1/financial/summary/installment-plans` - Planos de parcelamento

### Compras

- `GET /api/v1/shopping/lists` - Listar listas de compras
- `GET /api/v1/shopping/lists/:id` - Detalhes da lista
- `POST /api/v1/shopping/lists` - Criar lista
- `PUT /api/v1/shopping/lists/:id` - **[NOVO]** Sincronização completa da lista (Atualiza nome e substitui todos os itens)
- `DELETE /api/v1/shopping/lists/:id` - Excluir lista
- `POST /api/v1/shopping/lists/:id/complete` - Finalizar lista (Gera transação financeira)
- `POST /api/v1/shopping/lists/:listId/items` - **[ATUALIZADO]** Adicionar itens em lote
- `PUT /api/v1/shopping/lists/:listId/items/:itemId` - Atualizar item (Legado/Individual)
- `DELETE /api/v1/shopping/lists/:listId/items/:itemId` - Excluir item (Legado/Individual)
- `GET /api/v1/shopping/products` - Listar produtos
- `POST /api/v1/shopping/products` - Criar produto
- `PUT /api/v1/shopping/products/:id` - Atualizar produto
- `DELETE /api/v1/shopping/products/:id` - Excluir produto
- `GET /api/v1/shopping/categories` - Listar categorias de compras
- `POST /api/v1/shopping/categories` - Criar categoria de compras
- `PUT /api/v1/shopping/categories/:id` - Atualizar categoria de compras
- `DELETE /api/v1/shopping/categories/:id` - Excluir categoria de compras

## Segurança

### Proteções implementadas:

- **Helmet**: Protege contra vulnerabilidades HTTP comuns
- **CORS**: Configurado para aceitar requisições do frontend
- **JWT**: Autenticação baseada em tokens
- **Bcrypt**: Hash de senhas com salt
- **Joi**: Validação rigorosa de entrada de dados
- **Row Level Security**: Isolamento de dados por usuário
- **Rate Limiting**: Pode ser adicionado com middleware adicional
- **Input Sanitization**: Validação e sanitização de todos os inputs

### Proteção contra OWASP Top 10:

1. **Injection**: Uso de Supabase (PostgreSQL) com queries parametrizadas
2. **Broken Authentication**: JWT com expiração e validação rigorosa
3. **Sensitive Data Exposure**: Senhas hasheadas, dados sensíveis protegidos
4. **XML External Entities**: Não aplicável (não usamos XML)
5. **Broken Access Control**: RLS e verificação de propriedade em todas as rotas
6. **Security Misconfiguration**: Configurações seguras por padrão
7. **Cross-Site Scripting**: Validação de entrada e Helmet
8. **Insecure Deserialization**: Validação de tipos com TypeScript e Joi
9. **Using Components with Known Vulnerabilities**: Dependências atualizadas
10. **Insufficient Logging**: Logger de requisições e erros implementado

## Testes

Execute os testes com:

```bash
npm test
```

Execute validação de tipos:

```bash
npm run typecheck
```

Execute lint:

```bash
npm run lint
```

## Desenvolvimento

Execute em modo desenvolvimento:

```bash
npm run dev
```

Build para produção:

```bash
npm run build
npm start
```

## Deploy

O backend está pronto para deploy em serviços como:

- Vercel (serverless)
- Railway
- Render
- Digital Ocean
- AWS Lambda

Certifique-se de configurar as variáveis de ambiente no serviço de deploy.
