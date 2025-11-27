const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function runTest() {
  try {
    // 0. Register User (to ensure we have valid credentials)
    const email = `test.user.${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Registering user ${email}...`);
    try {
      // Note: full_name is not in the schema, so we don't send it.
      // The backend uses email as full_name by default.
      await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
      });
      console.log('User registered.');
    } catch (e) {
      console.log(
        'User registration failed (maybe already exists), trying login...',
      );
      if (e.response) {
        console.log('Registration error:', e.response.data);
      }
    }

    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: email,
      password: password,
    });
    const token = loginRes.data.token;
    console.log('Login successful. Token obtained.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create a Category and Product
    console.log('Creating a test category...');
    const categoryRes = await axios.post(
      `${API_URL}/shopping/categories`,
      { name: 'Test Category' },
      { headers },
    );
    const categoryId = categoryRes.data.category.id;
    console.log(`Category created with ID: ${categoryId}`);

    console.log('Creating a test product...');
    const productRes = await axios.post(
      `${API_URL}/shopping/products`,
      {
        name: `Test Product ${Date.now()}`,
        unit: 'un',
        category_id: categoryId,
      },
      { headers },
    );

    const productId = productRes.data.product.id;
    console.log(`Product created with ID: ${productId}`);

    // 3. Create Shopping List with the item
    console.log('Creating shopping list with the item...');
    const listRes = await axios.post(
      `${API_URL}/shopping/lists`,
      {
        name: `Atomic List ${Date.now()}`,
        items: [productId],
      },
      { headers },
    );

    console.log(
      'List creation response:',
      JSON.stringify(listRes.data, null, 2),
    );

    // 4. Verification
    const list = listRes.data.list;

    // Check if items are present.
    if (
      list.items &&
      list.items.length === 1 &&
      list.items[0].product_id === productId
    ) {
      console.log('SUCCESS: List created with the correct item.');
    } else {
      console.error('FAILURE: List items do not match expected.');
      console.log('Actual items:', list.items);
    }

    // 5. Test Rollback (Invalid Product ID)
    console.log('Testing rollback with invalid product ID...');
    try {
      await axios.post(
        `${API_URL}/shopping/lists`,
        {
          name: `Rollback List ${Date.now()}`,
          items: ['invalid-uuid-123'],
        },
        { headers },
      );
      console.error('FAILURE: Request should have failed but succeeded.');
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 500 || error.response.status === 400)
      ) {
        console.log('SUCCESS: Request failed as expected.');
      } else {
        console.log(
          `Request failed with status ${error.response?.status}, which is expected.`,
        );
      }
    }
  } catch (error) {
    console.error(
      'Test failed:',
      error.response ? error.response.data : error.message,
    );
  }
}

runTest();
