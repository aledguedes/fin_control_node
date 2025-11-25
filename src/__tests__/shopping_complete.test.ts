import request from 'supertest';
import app from '../server';

describe('Shopping list complete creates financial transaction', () => {
  let token: string;
  let listId: string;

  beforeAll(async () => {
    // Register and login test user
    await request(app).post('/api/v1/auth/register').send({
      email: 'test_shopping@example.com',
      password: 'password123',
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'test_shopping@example.com',
      password: 'password123',
    });

    token = login.body.token;

    // Create a shopping list
    const res = await request(app)
      .post('/api/v1/shopping/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Test List' });

    listId = res.body.list.id;

    // Create a category first
    const categoryRes = await request(app)
      .post('/api/v1/shopping/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Category' });

    const categoryId = categoryRes.body.category.id;

    // Create product with real category
    const productRes2 = await request(app)
      .post('/api/v1/shopping/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Product', unit: 'un', category_id: categoryId });

    const productId = productRes2.body.product.id;

    // Add item to list
    await request(app)
      .post(`/api/v1/shopping/lists/${listId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, quantity: 2, price: 10 });
  });

  it('completes list and creates financial transaction', async () => {
    const res = await request(app)
      .post(`/api/v1/shopping/lists/${listId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.list).toBeDefined();
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.amount).toBeGreaterThanOrEqual(0);
  }, 20000);
});
