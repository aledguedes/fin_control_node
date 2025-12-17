# Interfaces TypeScript - API MyFinControl

Este documento contém todas as interfaces TypeScript de **Request** e **Response** para cada endpoint da API, organizadas por módulo.

---

## 📋 Índice

- [Autenticação](#autenticação)
- [Financeiro - Categorias](#financeiro---categorias)
- [Financeiro - Transações](#financeiro---transações)
- [Financeiro - Sumários](#financeiro---sumários)
- [Compras - Listas](#compras---listas)
- [Compras - Produtos](#compras---produtos)
- [Compras - Categorias](#compras---categorias)
- [Compras - Itens](#compras---itens)
- [Tipos Comuns](#tipos-comuns)

---

## Autenticação

### POST `/api/v1/auth/register`

Registrar novo usuário

**Request:**

```typescript
interface RegisterRequest {
  email: string; // Formato email válido
  password: string; // Mínimo 6 caracteres
}
```

**Response (201):**

```typescript
interface RegisterResponse {
  message: string; // "Usuário criado com sucesso"
  user: {
    id: string; // UUID do usuário
    email: string;
  };
  token: string; // JWT token
}
```

---

### POST `/api/v1/auth/login`

Autenticar usuário

**Request:**

```typescript
interface LoginRequest {
  email?: string; // Email ou username é obrigatório
  username?: string; // Email ou username é obrigatório
  password: string; // Obrigatório
}
```

**Response (200):**

```typescript
interface LoginResponse {
  message: string; // "Login realizado com sucesso"
  user: {
    id: string; // UUID do usuário
    email: string;
  };
  token: string; // JWT token
}
```

---

### POST `/api/v1/auth/google-login`

Login via Google

**Request:**

```typescript
interface GoogleLoginRequest {
  id_token?: string; // Token do Google (opcional se email/name fornecidos)
  email?: string; // Email do usuário
  name?: string; // Nome completo do usuário
}
```

**Response (200):**

```typescript
interface GoogleLoginResponse {
  message: string; // "Login via Google realizado com sucesso"
  user: {
    id: string;
    email: string;
  };
  token: string;
}
```

---

## Financeiro - Categorias

### GET `/api/v1/financial/categories`

Listar categorias financeiras

**Request:** Nenhum body (autenticação via header)

**Response (200):**

```typescript
interface GetFinancialCategoriesResponse {
  categories: FinancialCategory[];
}

interface FinancialCategory {
  id: string; // UUID
  name: string;
  type: 'revenue' | 'expense';
  user_id: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

---

### POST `/api/v1/financial/categories`

Criar categoria financeira

**Request:**

```typescript
interface CreateFinancialCategoryRequest {
  name: string; // 1-100 caracteres
  type: 'revenue' | 'expense';
}
```

**Response (201):**

```typescript
interface CreateFinancialCategoryResponse {
  category: FinancialCategory;
}
```

---

## Financeiro - Transações

### GET `/api/v1/financial/transactions`

Listar transações

**Query Parameters:**

```typescript
interface GetTransactionsQuery {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  category_id?: string; // UUID
}
```

**Response (200):**

```typescript
interface GetTransactionsResponse {
  transactions: TransactionResponse[];
}

interface TransactionResponse {
  id: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category_id: string;
  user_id: string;
  transaction_date: string; // YYYY-MM-DD
  is_installment: boolean;
  is_recurrent: boolean;
  recurrence_start_date?: string; // YYYY-MM-DD
  total_installments?: number;
  start_date?: string; // YYYY-MM-DD
  paid_installments?: number;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}
```

---

### POST `/api/v1/financial/transactions`

Criar transação

**Request:**

```typescript
interface CreateTransactionRequest {
  description: string;
  amount: number; // Positivo
  type: 'revenue' | 'expense';
  category_id: string; // UUID
  transaction_date: string; // ISO 8601
  is_installment: boolean;
  is_recurrent?: boolean;
  recurrence_start_date?: string; // ISO 8601 (obrigatório se is_recurrent = true)
  payment_method?: string;
  installments: {
    total_installments: number; // Mínimo 1
    paid_installments: number; // Mínimo 0
    start_date: string; // ISO 8601
  };
}
```

**Response (201):**

```typescript
interface CreateTransactionResponse {
  transaction: TransactionResponse;
  message: string; // "Transação criada com sucesso."
}
```

---

### PUT `/api/v1/financial/transactions/:id`

Atualizar transação

**Request:**

```typescript
interface UpdateTransactionRequest {
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category_id: string;
  transaction_date: string; // YYYY-MM-DD
  installment_number?: number;
  total_installments?: number;
  payment_method?: string;
}
```

**Response (200):**

```typescript
interface UpdateTransactionResponse {
  transaction: TransactionResponse;
}
```

---

### DELETE `/api/v1/financial/transactions/:id`

Excluir transação

**Request:** Nenhum body

**Response (200):**

```typescript
interface DeleteTransactionResponse {
  message: string; // "Transação excluída com sucesso"
}
```

---

## Financeiro - Sumários

### GET `/api/v1/financial/summary/monthly-view`

Visão mensal consolidada

**Query Parameters:**

```typescript
interface MonthlyViewQuery {
  year: number; // 2020-2030
  month: number; // 1-12
}
```

**Response (200):**

```typescript
interface MonthlyViewResponse {
  year: number;
  month: number;
  transactions: MonthlyTransaction[];
  summary: {
    totalRevenue: number;
    totalExpense: number;
    balance: number;
  };
}

interface MonthlyTransaction {
  id: string;
  parent_id?: string; // Para parcelas
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  date: string; // YYYY-MM-DD
  category_id: string;
  isInstallment?: boolean;
  isRecurrent?: boolean;
  installment_number?: number;
  total_installments?: number;
}
```

---

### GET `/api/v1/financial/summary/installment-plans`

Planos de parcelamento

**Request:** Nenhum body

**Response (200):**

```typescript
interface InstallmentPlansResponse {
  installmentPlans: InstallmentPlan[];
}

interface InstallmentPlan {
  id: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  startDate: string; // YYYY-MM-DD
  status: 'ativo' | 'atrasado' | 'concluído';
  type: 'revenue' | 'expense';
  category_id: string;
}
```

---

## Compras - Listas

### GET `/api/v1/shopping/lists`

Listar listas de compras

**Request:** Nenhum body

**Response (200):**

```typescript
interface GetShoppingListsResponse {
  lists: ShoppingList[];
}

interface ShoppingList {
  id: string;
  name: string;
  status: 'pending' | 'completed';
  user_id: string;
  created_at: string;
  updated_at: string;
  total_amount?: number;
  items?: ShoppingListItem[]; // Incluído quando detalhes completos
}
```

---

### POST `/api/v1/shopping/lists`

Criar lista de compras

**Request:**

```typescript
interface CreateShoppingListRequest {
  name: string; // 1-200 caracteres
  items?: string[]; // Array de UUIDs de produtos (opcional)
}
```

**Response (201):**

```typescript
interface CreateShoppingListResponse {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  items: ShoppingListItem[];
}
```

---

### GET `/api/v1/shopping/lists/:id`

Detalhes da lista com itens

**Request:** Nenhum body

**Response (200):**

```typescript
interface GetShoppingListDetailsResponse {
  list: ShoppingList; // Com items incluídos
}
```

---

### PUT `/api/v1/shopping/lists/:id`

Sincronizar lista completa

**Request:**

```typescript
interface SyncShoppingListRequest {
  name?: string;
  status?: 'pending' | 'completed';
  items?: ShoppingListItem[]; // Substitui todos os itens
}
```

**Response (200):**

```typescript
interface SyncShoppingListResponse {
  list: ShoppingList;
}
```

---

### DELETE `/api/v1/shopping/lists/:id`

Excluir lista

**Request:** Nenhum body

**Response (200):**

```typescript
interface DeleteShoppingListResponse {
  message: string; // "Lista excluída com sucesso"
}
```

---

### POST `/api/v1/shopping/lists/:id/complete`

Finalizar lista

**Request:** Nenhum body

**Response (200):**

```typescript
interface CompleteShoppingListResponse {
  list: ShoppingList; // Com status 'completed' e total_amount calculado
}
```

---

## Compras - Produtos

### GET `/api/v1/shopping/products`

Listar produtos

**Request:** Nenhum body

**Response (200):**

```typescript
interface GetProductsResponse {
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  unit: 'un' | 'kg' | 'l' | 'dz' | 'm' | 'cx';
  category_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

---

### POST `/api/v1/shopping/products`

Criar produto

**Request:**

```typescript
interface CreateProductRequest {
  name: string; // 1-200 caracteres
  unit: 'un' | 'kg' | 'l' | 'dz' | 'm' | 'cx';
  category_id?: string; // UUID (opcional)
}
```

**Response (201):**

```typescript
interface CreateProductResponse {
  product: Product;
}
```

---

### PUT `/api/v1/shopping/products/:id`

Atualizar produto

**Request:**

```typescript
interface UpdateProductRequest {
  name?: string;
  unit?: 'un' | 'kg' | 'l' | 'dz' | 'm' | 'cx';
  category_id?: string;
}
```

**Response (200):**

```typescript
interface UpdateProductResponse {
  product: Product;
}
```

---

### DELETE `/api/v1/shopping/products/:id`

Excluir produto

**Request:** Nenhum body

**Response (200):**

```typescript
interface DeleteProductResponse {
  message: string; // "Produto excluído com sucesso"
}
```

---

## Compras - Categorias

### GET `/api/v1/shopping/categories`

Listar categorias de compra

**Request:** Nenhum body

**Response (200):**

```typescript
interface GetShoppingCategoriesResponse {
  categories: ShoppingCategory[];
}

interface ShoppingCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

---

### POST `/api/v1/shopping/categories`

Criar categoria de compra

**Request:**

```typescript
interface CreateShoppingCategoryRequest {
  name: string; // 1-100 caracteres
}
```

**Response (201):**

```typescript
interface CreateShoppingCategoryResponse {
  category: ShoppingCategory;
}
```

---

### PUT `/api/v1/shopping/categories/:id`

Atualizar categoria de compra

**Request:**

```typescript
interface UpdateShoppingCategoryRequest {
  name: string;
}
```

**Response (200):**

```typescript
interface UpdateShoppingCategoryResponse {
  category: ShoppingCategory;
}
```

---

### DELETE `/api/v1/shopping/categories/:id`

Excluir categoria de compra

**Request:** Nenhum body

**Response (200):**

```typescript
interface DeleteShoppingCategoryResponse {
  message: string; // "Categoria excluída com sucesso"
}
```

---

## Compras - Itens

### POST `/api/v1/shopping/lists/:listId/items`

Adicionar item(ns) à lista

**Request (Individual):**

```typescript
interface CreateShoppingItemRequest {
  product_id: string; // UUID
  quantity: number; // Positivo
  price?: number; // Positivo (opcional, padrão 0)
  category_id?: string; // UUID (opcional)
}
```

**Request (Lote):**

```typescript
type CreateBatchShoppingItemsRequest = CreateShoppingItemRequest[];
```

**Response (201 - Individual):**

```typescript
interface CreateShoppingItemResponse {
  item: ShoppingListItem;
}
```

**Response (201 - Lote):**

```typescript
interface CreateBatchShoppingItemsResponse {
  items: ShoppingListItem[];
}
```

---

### PUT `/api/v1/shopping/lists/:listId/items/:itemId`

Atualizar item da lista

**Request:**

```typescript
interface UpdateShoppingItemRequest {
  quantity?: number;
  price?: number;
  checked?: boolean; // Marcar como comprado
}
```

**Response (200):**

```typescript
interface UpdateShoppingItemResponse {
  item: ShoppingListItem;
}
```

---

### DELETE `/api/v1/shopping/lists/:listId/items/:itemId`

Excluir item da lista

**Request:** Nenhum body

**Response (200):**

```typescript
interface DeleteShoppingItemResponse {
  message: string; // "Item excluído com sucesso"
}
```

---

## Tipos Comuns

### ShoppingListItem

```typescript
interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  product_id: string;
  quantity: number;
  price: number;
  checked: boolean;
  category_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  // Campos expandidos (quando incluídos)
  product?: Product;
  category?: ShoppingCategory;
}
```

---

### ErrorResponse

```typescript
interface ErrorResponse {
  error: string; // Mensagem de erro
  statusCode?: number; // Código HTTP
}
```

---

## 🔐 Autenticação

Todos os endpoints (exceto `/auth/register`, `/auth/login` e `/auth/google-login`) requerem autenticação via **Bearer Token** no header:

```typescript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

---

## 📝 Notas Importantes

1. **UUIDs**: Todos os IDs são strings UUID v4
2. **Datas**: Formato ISO 8601 (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ss.sssZ`)
3. **Números**: Valores monetários e quantidades são `number` (float/decimal)
4. **Enums**: Valores específicos devem corresponder exatamente aos listados
5. **Opcionais**: Campos marcados com `?` são opcionais

---

## 🚀 Exemplo de Uso

```typescript
// Exemplo: Criar uma transação
const response = await fetch(
  'http://localhost:3000/api/v1/financial/transactions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Salário',
      amount: 5000.0,
      type: 'revenue',
      category_id: 'uuid-da-categoria',
      transaction_date: '2024-01-15',
      is_installment: false,
      installments: {
        total_installments: 1,
        paid_installments: 0,
        start_date: '2024-01-15',
      },
    }),
  },
);

const data: CreateTransactionResponse = await response.json();
```

---

## 📚 Referências

- [Documentação Swagger](http://localhost:3000/api-docs) - Documentação interativa da API
- [CORS_CONFIG.md](file:///c:/Xandão/node/my-fin-control-backend/CORS_CONFIG.md) - Configuração de CORS
