# Deploy via Render MCP Server

Este guia explica como configurar e usar o Render MCP Server para fazer deploy automatizado.

## Pré-requisitos

1. Conta no [Render.com](https://render.com)
2. Chave de API do Render (obtenha em: https://dashboard.render.com/account/api-keys)
3. Node.js instalado

## Instalação do Render MCP Server

### Opção 1: Instalação Global

```bash
npm install -g @niyogi/render-mcp
```

### Opção 2: Instalação Local (Recomendado)

```bash
npm install --save-dev @niyogi/render-mcp
```

## Configuração

### 1. Obter Chave de API do Render

1. Acesse https://dashboard.render.com/account/api-keys
2. Clique em "Create API Key"
3. Copie a chave gerada

### 2. Configurar o Render MCP Server

Se instalado globalmente:
```bash
render-mcp configure --api-key=SUA_CHAVE_API_AQUI
```

Ou sem flag (será solicitado interativamente):
```bash
render-mcp configure
```

Se instalado localmente:
```bash
npx render-mcp configure --api-key=SUA_CHAVE_API_AQUI
```

### 3. Configurar no Cursor/IDE

Adicione ao arquivo de configuração do MCP (geralmente em `~/.cursor/mcp.json` ou similar):

```json
{
  "mcpServers": {
    "render": {
      "command": "node",
      "args": ["node_modules/@niyogi/render-mcp/bin/render-mcp.js", "start"],
      "env": {
        "RENDER_API_KEY": "sua-chave-api-aqui"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Uso

Após configurado, você pode usar comandos MCP para:

- Criar serviços web
- Fazer deploy de aplicações
- Gerenciar variáveis de ambiente
- Visualizar logs
- Gerenciar serviços

## Comandos Disponíveis

O Render MCP Server oferece os seguintes comandos:

- `create_web_service` - Criar novo serviço web
- `deploy_service` - Fazer deploy de um serviço
- `list_services` - Listar todos os serviços
- `get_service_details` - Obter detalhes de um serviço
- `update_environment_variables` - Atualizar variáveis de ambiente
- `get_service_logs` - Obter logs do serviço

## Deploy Manual (Alternativa)

Se o MCP não estiver disponível, você pode fazer deploy manualmente:

1. **Via Dashboard Web** (Recomendado para primeira vez):
   - Acesse https://dashboard.render.com
   - Clique em "New +" > "Web Service"
   - Conecte seu repositório Git
   - O arquivo `render.yaml` será detectado automaticamente

2. **Via Render CLI** (se disponível):
   ```bash
   npm install -g render-cli
   render deploy
   ```

## Variáveis de Ambiente Necessárias

Certifique-se de configurar estas variáveis no Render:

```
NODE_ENV=production
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
JWT_SECRET=sua_chave_secreta_forte
ALLOWED_ORIGINS=https://seu-frontend.com
```

## Referências

- [Render MCP Server GitHub](https://github.com/niyogi/render-mcp)
- [Render API Documentation](https://render.com/docs/api)
- [Render Dashboard](https://dashboard.render.com)

