import request from 'supertest';
import app from '../server';

describe('Financial monthly view', () => {
  let token: string;

  beforeAll(async () => {
    // Register a test user
    await request(app).post('/api/v1/auth/register').send({
      email: 'test_monthly@example.com',
      password: 'password123',
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'test_monthly@example.com',
      password: 'password123',
    });

    token = login.body.token;
  });

  it('returns single, installment and recurring entries for month', async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Create a single transaction on this month
    await request(app)
      .post('/api/v1/financial/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Single Tx',
        amount: 100,
        type: 'expense',
        category_id: null,
        transaction_date: `${year}-${String(month).padStart(2, '0')}-10`,
        is_installment: false,
        installments: {
          total_installments: 1,
          start_date: `${year}-${String(month).padStart(2, '0')}-10`,
        },
      });

    // Create an installment transaction starting this month (3 installments)
    await request(app)
      .post('/api/v1/financial/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Installment Tx',
        amount: 300,
        type: 'expense',
        category_id: null,
        transaction_date: `${year}-${String(month).padStart(2, '0')}-05`,
        is_installment: true,
        installments: {
          total_installments: 3,
          start_date: `${year}-${String(month).padStart(2, '0')}-05`,
        },
      });

    // Create a recurring transaction started earlier this year
    const recurrenceStart = `${year}-${String(Math.max(1, month - 1)).padStart(
      2,
      '0',
    )}-15`;
    await request(app)
      .post('/api/v1/financial/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Recurring Tx',
        amount: 50,
        type: 'expense',
        category_id: null,
        transaction_date: recurrenceStart,
        is_installment: false,
        is_recurrent: true,
        recurrence_start_date: recurrenceStart,
        installments: { total_installments: 1, start_date: recurrenceStart },
      });

    const res = await request(app)
      .get(`/api/v1/financial/summary/monthly-view?year=${year}&month=${month}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.year).toBe(year);
    expect(res.body.month).toBe(month);
    expect(Array.isArray(res.body.transactions)).toBeTruthy();

    // Expect at least 3 entries (single, one installment entry for current month, recurring)
    const descriptions = res.body.transactions.map(
      (t: any) => t.description || (t.parent_id && 'Installment Tx'),
    );
    expect(
      descriptions.some((d: any) => d && d.includes('Single Tx')),
    ).toBeTruthy();
    expect(
      descriptions.some((d: any) => d && d.includes('Installment Tx')),
    ).toBeTruthy();
    expect(
      descriptions.some((d: any) => d && d.includes('Recurring Tx')),
    ).toBeTruthy();
  }, 20000);
});
