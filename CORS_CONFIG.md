# Configuração de CORS

## Visão Geral

Este backend implementa uma configuração de CORS (Cross-Origin Resource Sharing) flexível e segura que pode ser ajustada através de variáveis de ambiente.

## Configuração Atual

A configuração de CORS está implementada em [`src/server.ts`](file:///c:/Xandão/node/my-fin-control-backend/src/server.ts) e suporta dois modos de operação:

### 1. Permitir Todas as Origens (Desenvolvimento)

Para permitir acesso de **qualquer origem**, defina a variável de ambiente:

```bash
ALLOW_ALL_ORIGINS=true
```

> [!WARNING]
> Este modo é recomendado **apenas para desenvolvimento**. Em produção, sempre especifique as origens permitidas.

### 2. Origens Específicas (Produção)

Para maior segurança, especifique as origens permitidas separadas por vírgula:

```bash
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:5173,https://meu-app.com
```

## Configuração por Ambiente

### Desenvolvimento (`.env.development`)

```bash
# Permite acesso de qualquer origem
ALLOW_ALL_ORIGINS=true
```

### Produção (`.env.production`)

```bash
# Especifique as URLs exatas do seu frontend
ALLOWED_ORIGINS=https://seu-frontend.com,https://www.seu-frontend.com
```

## Métodos HTTP Permitidos

A configuração atual permite os seguintes métodos HTTP:

- `GET`
- `HEAD`
- `PUT`
- `PATCH`
- `POST`
- `DELETE`
- `OPTIONS`

## Headers Permitidos

Os seguintes headers são permitidos nas requisições:

- `Content-Type`
- `Authorization`
- `Accept`
- `Origin`
- `X-Requested-With`

## Credenciais

A opção `credentials: true` está habilitada, permitindo o envio de cookies e headers de autenticação nas requisições cross-origin.

## Pre-flight Requests

O servidor está configurado para responder automaticamente a requisições OPTIONS (pre-flight) para todas as rotas.

## Requisições sem Origin

Requisições que não incluem o header `Origin` (como chamadas de Postman, cURL, ou aplicativos mobile) são **sempre permitidas**.

## Logs de Segurança

Quando uma origem não permitida tenta acessar a API, um aviso é registrado no console:

```
⚠️  CORS bloqueou requisição de origem não permitida: http://origem-nao-permitida.com
```

## Exemplos de Uso

### Exemplo 1: Desenvolvimento Local

```bash
# .env.development
ALLOW_ALL_ORIGINS=true
```

Permite acesso de qualquer frontend rodando localmente (Angular, React, Vue, etc.).

### Exemplo 2: Múltiplos Frontends

```bash
# .env.production
ALLOWED_ORIGINS=https://app.exemplo.com,https://admin.exemplo.com,https://mobile.exemplo.com
```

### Exemplo 3: Desenvolvimento com Origens Específicas

```bash
# .env.development
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:5173
```

## Troubleshooting

### Erro: "Not allowed by CORS"

Se você receber este erro:

1. **Verifique a variável de ambiente**: Certifique-se de que `ALLOW_ALL_ORIGINS=true` está definida ou que a origem está listada em `ALLOWED_ORIGINS`
2. **Reinicie o servidor**: Após alterar as variáveis de ambiente, reinicie o servidor
3. **Verifique os logs**: Procure por mensagens de aviso no console do servidor
4. **Verifique a URL exata**: A URL deve corresponder exatamente (incluindo protocolo e porta)

### Exemplo de URL Correta

❌ **Incorreto**: `localhost:4200` (falta o protocolo)  
✅ **Correto**: `http://localhost:4200`

## Segurança

> [!CAUTION]
> Em produção, **NUNCA** use `ALLOW_ALL_ORIGINS=true`. Sempre especifique as origens permitidas explicitamente.

### Boas Práticas

1. ✅ Use `ALLOW_ALL_ORIGINS=true` apenas em desenvolvimento
2. ✅ Em produção, liste apenas as URLs necessárias em `ALLOWED_ORIGINS`
3. ✅ Inclua todas as variações da URL (com e sem `www`, diferentes subdomínios)
4. ✅ Use HTTPS em produção
5. ❌ Não exponha APIs sensíveis sem autenticação adequada

## Referências

- [MDN - CORS](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS)
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)
