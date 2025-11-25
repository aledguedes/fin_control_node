const { DatabaseService } = require('./dist/services/databaseService');

async function testSQLite() {
  console.log('🧪 Testando SQLite...');

  try {
    // Testar criação de usuário
    console.log('👤 Criando usuário de teste...');
    const userResult = await DatabaseService.createUser({
      email: 'teste2@example.com',
      password: 'hashed_password_123',
      full_name: 'Teste Usuario 2',
    });

    console.log('✅ Usuário criado:', userResult.data);

    // Testar busca de usuário
    console.log('🔍 Buscando usuário...');
    const foundUser = await DatabaseService.getUserByEmail(
      'teste2@example.com',
    );
    console.log('✅ Usuário encontrado:', foundUser.data);

    // Testar criação de categoria
    console.log('📊 Criando categoria financeira...');
    const categoryResult = await DatabaseService.createFinancialCategory({
      name: 'Alimentação',
      type: 'expense',
      user_id: userResult.data.id,
    });

    console.log('✅ Categoria criada:', categoryResult.data);

    // Testar listagem de categorias
    console.log('📋 Listando categorias...');
    const categories = await DatabaseService.getFinancialCategories(
      userResult.data.id,
    );
    console.log('✅ Categorias encontradas:', categories.data);

    console.log('🎉 Todos os testes passaram!');
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

testSQLite();
