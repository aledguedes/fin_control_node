import request from 'supertest';
import app from '../server';
import { DatabaseService } from '../services/databaseService';

describe('Shopping List Sync and Batch Operations', () => {
  let token: string;
  let userId: number;
  let listId: string;
  let product1Id: number;
  let product2Id: number;
  let categoryId: number;

  beforeAll(async () => {
    // 1. Register and login
    const email = `test_sync_${Date.now()}@example.com`;
    await request(app).post('/api/v1/auth/register').send({
      email,
      password: 'password123',
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email,
      password: 'password123',
    });

    token = login.body.token;
    userId = login.body.user.id;

    // 2. Create Category
    const catRes = await request(app)
      .post('/api/v1/shopping/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sync Category' });
    categoryId = catRes.body.category.id;

    // 3. Create Products
    const p1 = await request(app)
      .post('/api/v1/shopping/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Product 1', unit: 'un', category_id: categoryId });
    product1Id = p1.body.product.id;

    const p2 = await request(app)
      .post('/api/v1/shopping/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Product 2', unit: 'kg', category_id: categoryId });
    product2Id = p2.body.product.id;

    // 4. Create List
    const listRes = await request(app)
      .post('/api/v1/shopping/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Original List' });
    listId = listRes.body.id;
  });

  it('should sync shopping list (update name and replace items)', async () => {
    // Initial state: empty list

    const syncPayload = {
      id: listId,
      name: 'Synced List Name',
      items: [
        { productId: product1Id, quantity: 5, price: 10.0, checked: true },
        { productId: product2Id, quantity: 2.5, price: 20.0, checked: false },
      ],
    };

    const res = await request(app)
      .put(`/api/v1/shopping/lists/${listId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(syncPayload)
      .expect(200);

    expect(res.body.list.name).toBe('Synced List Name');
    expect(res.body.list.items).toHaveLength(2);

    const item1 = res.body.list.items.find(
      (i: any) => i.product_id === product1Id,
    );
    expect(item1).toBeDefined();
    expect(item1.quantity).toBe(5);
    expect(item1.checked).toBe(true); // SQLite boolean is 0/1, Supabase is true/false

    const item2 = res.body.list.items.find(
      (i: any) => i.product_id === product2Id,
    );
    expect(item2).toBeDefined();
    expect(item2.quantity).toBe(2.5);
  });

  it('should add items in batch', async () => {
    // Create another list for batch test
    const listRes = await request(app)
      .post('/api/v1/shopping/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Batch List' });
    const batchListId = listRes.body.id;

    const batchItems = [
      { productId: product1Id, quantity: 1, price: 5.0 },
      { productId: product2Id, quantity: 1, price: 5.0 },
    ];

    const res = await request(app)
      .post(`/api/v1/shopping/lists/${batchListId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send(batchItems)
      .expect(201);

    expect(res.body.items).toHaveLength(2);
  });

  it('should complete list atomically and create transaction', async () => {
    // Use the synced list from first test
    const res = await request(app)
      .post(`/api/v1/shopping/lists/${listId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.list.status).toBe('completed');
    expect(res.body.list.total_amount).toBe(100); // (5*10) + (2.5*20) = 50 + 50 = 100

    // Verify transaction exists in DB (via API or direct DB check if possible, but API is better)
    // We don't have a direct transaction ID returned in the new atomic response (it returns list),
    // but we can check the transaction list for the user.

    const txRes = await request(app)
      .get('/api/v1/financial/transactions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const transaction = txRes.body.transactions.find((t: any) =>
      t.description.includes('Synced List Name'),
    );
    expect(transaction).toBeDefined();
    expect(transaction.amount).toBe(100);
  });
});
