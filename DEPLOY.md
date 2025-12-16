# Guia de Deploy no Render.com

Este documento contém as instruções para fazer deploy da aplicação no Render.com.

## Pré-requisitos

1. Conta no [Render.com](https://render.com)
2. Repositório Git (GitHub, GitLab ou Bitbucket) com o código commitado
3. Projeto Supabase configurado e migrations executadas

## Configuração no Render.com

### 1. Criar Novo Web Service

1. Acesse o [Dashboard do Render](https://dashboard.render.com)
2. Clique em "New +" e selecione "Web Service"
3. Conecte seu repositório Git
4. Selecione o repositório `my-fin-control-backend`

### 2. Configurações do Serviço

O arquivo `render.yaml` já está configurado, mas você pode ajustar manualmente:

- **Name**: `my-fin-control-backend`
- **Environment**: `Node`
- **Region**: `Oregon` (ou a região mais próxima)
- **Branch**: `main` (ou sua branch principal)
- **Root Directory**: ⚠️ **DEVE ESTAR VAZIO** (não coloque `src` aqui!)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/server.js` (ou `npm start`)

⚠️ **IMPORTANTE**: Se você configurou manualmente no painel do Render e colocou `src` no campo "Root Directory", remova isso! O Root Directory deve estar **vazio** para que o build funcione corretamente.

### 3. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel do Render:

#### Obrigatórias:

```
NODE_ENV=production
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
JWT_SECRET=sua_chave_secreta_forte_minimo_32_caracteres
ALLOWED_ORIGINS=https://seu-frontend.com,https://www.seu-frontend.com
```

#### Opcionais:

```
PORT=(deixe vazio, o Render define automaticamente)
JWT_EXPIRES_IN=24h
ALLOW_ALL_ORIGINS=false
GOOGLE_CLIENT_ID=sua_google_client_id (se usar login social)
```

### 4. Health Check

O Render está configurado para usar o endpoint `/health` como health check. Certifique-se de que este endpoint está funcionando corretamente.

## Após o Deploy

### Verificações

1. **Health Check**: Acesse `https://seu-app.onrender.com/health`

   - Deve retornar: `{"status":"OK","timestamp":"..."}`

2. **Swagger Docs**: Acesse `https://seu-app.onrender.com/api-docs`

   - Deve mostrar a documentação da API

3. **Teste de Autenticação**:
   - POST `https://seu-app.onrender.com/api/v1/auth/register`
   - POST `https://seu-app.onrender.com/api/v1/auth/login`

### Logs

- Acesse os logs no painel do Render em "Logs"
- Os logs mostrarão mensagens do servidor e erros, se houver

## Troubleshooting

### Erro de Build

- Verifique se todas as dependências estão no `package.json`
- Verifique se o TypeScript compila sem erros: `npm run build`
- **Verifique se o "Root Directory" no painel do Render está VAZIO** (não deve ter `src` ou qualquer outro valor)
- Verifique se o arquivo `dist/server.js` está sendo gerado após o build

### Erro de Conexão com Supabase

- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão corretos
- Verifique se o Supabase permite conexões do IP do Render

### Erro de CORS

- Verifique se `ALLOWED_ORIGINS` contém a URL exata do seu frontend
- Certifique-se de que `ALLOW_ALL_ORIGINS=false` em produção

### Servidor não inicia

- Verifique os logs no Render
- Verifique se a porta está sendo lida corretamente (deve usar `process.env.PORT`)
- **Erro "Cannot find module '/opt/render/project/src/dist/server.js'**:
  - Isso indica que o "Root Directory" está configurado como `src` no painel do Render
  - Vá em Settings > Advanced e remova qualquer valor do campo "Root Directory"
  - O Root Directory deve estar **completamente vazio**

## Comandos Úteis

```bash
# Build local para testar
npm run build

# Testar produção localmente
npm run start:prod

# Verificar tipos
npm run typecheck

# Executar testes
npm test
```

## Notas Importantes

1. **Plano Free**: O Render oferece um plano free, mas o serviço "hiberna" após 15 minutos de inatividade. Para produção, considere um plano pago.

2. **Variáveis Sensíveis**: Nunca commite arquivos `.env*` no Git. Eles já estão no `.gitignore`.

3. **Migrations**: Certifique-se de que todas as migrations do Supabase foram executadas antes do deploy.

4. **CORS**: Configure `ALLOWED_ORIGINS` com as URLs exatas do seu frontend em produção.

5. **JWT Secret**: Use uma chave secreta forte e única para produção. Gere uma com:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
