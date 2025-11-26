import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyFinControl API',
      version: '1.0.0',
      description:
        'API RESTful para controle financeiro e gerenciamento de listas de compras',
      contact: {
        name: 'MyFinControl',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.myfincontrol.com/api/v1',
        description: 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint de login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
            messages: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Lista de mensagens de validação (opcional)',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Identificador único do usuário',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail do usuário',
            },
          },
        },
        FinancialCategory: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Identificador único da categoria',
            },
            name: {
              type: 'string',
              description: 'Nome da categoria',
              example: 'Moradia',
            },
            type: {
              type: 'string',
              enum: ['revenue', 'expense'],
              description: 'Tipo da categoria (receita ou despesa)',
            },
            user_id: {
              type: 'integer',
              description: 'ID do usuário proprietário',
            },
          },
        },
        TransactionResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID da transação' },
            description: { type: 'string', description: 'Descrição' },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Valor total',
            },
            type: {
              type: 'string',
              enum: ['revenue', 'expense'],
              description: 'Tipo',
            },
            transaction_date: {
              type: 'string',
              format: 'date',
              description: 'Data da transação',
            },
            category_id: { type: 'integer', description: 'ID da categoria' },
            installment_number: {
              type: 'integer',
              description: 'Número da parcela',
            },
            total_installments: {
              type: 'integer',
              description: 'Total de parcelas',
            },
            is_installment: { type: 'boolean', description: 'É parcelada?' },
            is_recurrent: { type: 'boolean', description: 'É recorrente?' },
            recurrence_start_date: {
              type: 'string',
              format: 'date',
              description: 'Data início recorrência',
              nullable: true,
            },
            installments: { $ref: '#/components/schemas/Installments' },
            payment_method: {
              type: 'string',
              description: 'Método de pagamento',
              nullable: true,
            },
            user_id: { type: 'integer', description: 'ID do usuário' },
          },
        },
        TransactionCreate: {
          type: 'object',
          required: [
            'description',
            'amount',
            'type',
            'category_id',
            'transaction_date',
          ],
          properties: {
            description: { type: 'string', description: 'Descrição' },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Valor total',
            },
            type: {
              type: 'string',
              enum: ['revenue', 'expense'],
              description: 'Tipo',
            },
            category_id: { type: 'integer', description: 'ID da categoria' },
            transaction_date: {
              type: 'string',
              format: 'date',
              description: 'Data da transação',
            },
            is_installment: { type: 'boolean', description: 'É parcelada?' },
            is_recurrent: { type: 'boolean', description: 'É recorrente?' },
            recurrence_start_date: {
              type: 'string',
              format: 'date',
              description: 'Data início recorrência',
              nullable: true,
            },
            installments: { $ref: '#/components/schemas/Installments' },
            payment_method: {
              type: 'string',
              description: 'Método de pagamento',
              nullable: true,
            },
          },
        },
        Installments: {
          type: 'object',
          required: ['totalInstallments', 'startDate'],
          properties: {
            totalInstallments: {
              type: 'integer',
              description: 'Número total de parcelas',
            },
            startDate: {
              type: 'string',
              format: 'date',
              description: 'Data da primeira parcela',
            },
            paidInstallments: {
              type: 'integer',
              description: 'Parcelas já pagas',
            },
          },
        },
        ShoppingCategory: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Identificador único da categoria',
            },
            name: {
              type: 'string',
              description: 'Nome da categoria',
              example: 'Higiene',
            },
            user_id: {
              type: 'integer',
              description: 'ID do usuário proprietário',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Identificador único do produto',
            },
            name: {
              type: 'string',
              description: 'Nome do produto',
              example: 'Arroz Integral 5kg',
            },
            unit: {
              type: 'string',
              enum: ['un', 'kg', 'l', 'dz', 'm', 'cx'],
              description: 'Unidade de medida do produto',
            },
            category_id: {
              type: 'integer',
              description: 'ID da categoria de compra',
              nullable: true,
            },
            user_id: {
              type: 'integer',
              description: 'ID do usuário proprietário',
            },
          },
        },
        ShoppingList: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Identificador único da lista',
            },
            name: {
              type: 'string',
              description: 'Nome da lista',
              example: 'Compras do mês',
            },
            status: {
              type: 'string',
              enum: ['andamento', 'finalizada'],
              description: 'Status da lista',
              default: 'andamento',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação',
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de finalização',
              nullable: true,
            },
            total_amount: {
              type: 'number',
              format: 'decimal',
              description: 'Valor total da lista (calculado ao finalizar)',
              nullable: true,
            },
            user_id: {
              type: 'integer',
              description: 'ID do usuário proprietário',
            },
          },
        },
        ShoppingItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Identificador único do item',
            },
            quantity: {
              type: 'number',
              format: 'decimal',
              description: 'Quantidade do produto',
              example: 2.5,
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Preço unitário',
              example: 15.99,
            },
            checked: {
              type: 'boolean',
              description: 'Indica se o item foi marcado como comprado',
              default: false,
            },
            shopping_list_id: {
              type: 'integer',
              description: 'ID da lista de compras',
            },
            product_id: {
              type: 'integer',
              description: 'ID do produto',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Caminho para os arquivos de rotas
};

let swaggerSpec: any = {};
try {
  swaggerSpec = swaggerJsdoc(options);
} catch (err) {
  // Em caso de erro de parsing (JSDoc/Swagger inválido), registrar e exportar spec vazio
  // Isso evita que a aplicação quebre durante desenvolvimento enquanto corrigimos os comentários.
  // A documentação pode ser reabilitada quando os blocos JSDoc forem validados.
  // eslint-disable-next-line no-console
  console.warn(
    'Swagger spec generation failed:',
    err && (err as Error).message,
  );
  swaggerSpec = {};
}

export { swaggerUi, swaggerSpec };
