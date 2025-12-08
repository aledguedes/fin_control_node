import { db, dbConfig } from '../server';

export class DatabaseService {
  // Métodos genéricos para SQLite
  private static querySQLite(sql: string, params: any[] = []) {
    if (dbConfig.type === 'sqlite') {
      const stmt = db.prepare(sql);
      const sqlLower = sql.trim().toLowerCase();
      if (sqlLower.startsWith('select') || sqlLower.includes('returning')) {
        return stmt.all(params);
      } else {
        const result = stmt.run(params);
        return {
          data: { lastInsertRowid: result.lastInsertRowid },
          error: null,
        };
      }
    }
    return null;
  }

  // Métodos genéricos para Supabase
  private static async querySupabase(
    table: string,
    operation: string,
    data?: any,
    filters?: any,
  ) {
    if (dbConfig.type === 'supabase') {
      let query = db.from(table);

      switch (operation) {
        case 'select':
          query = query.select('*');
          if (filters) {
            Object.keys(filters).forEach((key) => {
              query = query.eq(key, filters[key]);
            });
          }
          break;
        case 'insert':
          query = query.insert(data);
          break;
        case 'update':
          query = query.update(data);
          if (filters) {
            Object.keys(filters).forEach((key) => {
              query = query.eq(key, filters[key]);
            });
          }
          break;
        case 'delete':
          query = query.delete();
          if (filters) {
            Object.keys(filters).forEach((key) => {
              query = query.eq(key, filters[key]);
            });
          }
          break;
      }

      const result = await query;
      return { data: result.data, error: result.error };
    }
    return null;
  }

  // Métodos específicos para Users
  static async getUserByEmail(email: string) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT * FROM tbl_users WHERE email = ?',
        [email],
      );
      return {
        data: result && result.length > 0 ? result[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase('tbl_users', 'select', null, { email });
    }
  }

  static async createUser(userData: any) {
    if (dbConfig.type === 'sqlite') {
      const { email, password_hash, password, full_name } = userData;
      const passwordToStore = password_hash || password;
      const result = this.querySQLite(
        'INSERT INTO tbl_users (email, password) VALUES (?, ?) RETURNING *',
        [email, passwordToStore],
      );

      if (result && result.length > 0) {
        return {
          data: result[0],
          error: null,
        };
      }
      return { data: null, error: { message: 'Erro ao criar usuário' } };
    } else {
      return await this.querySupabase('tbl_users', 'insert', userData);
    }
  }

  static async getUserById(id: string | number) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite('SELECT * FROM tbl_users WHERE id = ?', [
        id,
      ]);
      return {
        data: result && result.length > 0 ? result[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase('tbl_users', 'select', null, { id });
    }
  }

  // Métodos para Financial Categories
  static async getFinancialCategories(userId: string | number) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT * FROM tbl_financial_categories WHERE user_id = ?',
        [userId],
      );
      return { data: result, error: null };
    } else {
      return await this.querySupabase(
        'tbl_financial_categories',
        'select',
        null,
        { user_id: userId },
      );
    }
  }

  static async createFinancialCategory(categoryData: any) {
    if (dbConfig.type === 'sqlite') {
      const { name, type, user_id } = categoryData;
      const result = this.querySQLite(
        'INSERT INTO tbl_financial_categories (name, type, user_id) VALUES (?, ?, ?)',
        [name, type, user_id],
      );

      if (result && result.data) {
        const categoryId = result.data.lastInsertRowid;
        const newCategory = this.querySQLite(
          'SELECT * FROM tbl_financial_categories WHERE id = ?',
          [categoryId],
        );
        return {
          data: newCategory && newCategory.length > 0 ? newCategory[0] : null,
          error: null,
        };
      }
      return { data: null, error: { message: 'Erro ao criar categoria' } };
    } else {
      return await this.querySupabase(
        'tbl_financial_categories',
        'insert',
        categoryData,
      );
    }
  }

  static async getFinancialTransactions(
    userId: string | number,
    filters?: any,
  ) {
    if (dbConfig.type === 'sqlite') {
      let sql = 'SELECT * FROM tbl_transactions WHERE user_id = ?';
      const params = [userId];

      if (filters?.start_date) {
        sql += ' AND transaction_date >= ?';
        params.push(filters.start_date);
      }
      if (filters?.end_date) {
        sql += ' AND transaction_date <= ?';
        params.push(filters.end_date);
      }
      if (filters?.category_id) {
        sql += ' AND category_id = ?';
        params.push(filters.category_id);
      }

      const result = this.querySQLite(sql, params);
      return { data: result, error: null };
    } else {
      let query = db.from('tbl_transactions').select('*').eq('user_id', userId);

      if (filters?.start_date)
        query = query.gte('transaction_date', filters.start_date);
      if (filters?.end_date)
        query = query.lte('transaction_date', filters.end_date);
      if (filters?.category_id)
        query = query.eq('category_id', filters.category_id);

      const result = await query;
      return { data: result.data, error: result.error };
    }
  }

  static async createFinancialTransaction(transactionData: any) {
    const {
      description,
      amount,
      type,
      category_id,
      user_id,
      transaction_date,
      is_installment = false,
      is_recurrent = false,
      recurrence_start_date,
      total_installments = 1,
      paid_installments = 0,
      start_date,
      payment_method,
    } = transactionData;

    let installments_json = null;

    const installmentsData = {
      totalInstallments: total_installments,
      paidInstallments: paid_installments,
      startDate: start_date,
    };
    installments_json = JSON.stringify(installmentsData);

    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        `INSERT INTO tbl_transactions (description, amount, type, category_id, user_id, transaction_date, is_installment, total_installments, installment_number, start_date, installments, is_recurrent, recurrence_start_date, payment_method) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
         RETURNING *`,
        [
          description,
          amount,
          type,
          category_id,
          user_id,
          transaction_date,
          is_installment ? 1 : 0,
          total_installments,
          1,
          start_date || transaction_date,
          installments_json,
          is_recurrent ? 1 : 0,
          recurrence_start_date || null,
          payment_method || null,
        ],
      );

      if (result && result.length > 0) {
        return {
          data: result[0],
          error: null,
        };
      }
      return { data: null, error: { message: 'Erro ao criar transação' } };
    } else {
      const dataToInsert = {
        description,
        amount,
        type,
        category_id,
        user_id,
        transaction_date: transaction_date,
        is_installment,
        total_installments,
        installment_number: 1,
        start_date: start_date || transaction_date,
        installments: installments_json,
        is_recurrent,
        recurrence_start_date,
        payment_method,
      };

      return await this.querySupabase(
        'tbl_transactions',
        'insert',
        dataToInsert,
      );
    }
  }

  static async getFinancialTransactionById(
    id: string | number,
    userId: string | number,
  ) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT * FROM tbl_transactions WHERE id = ? AND user_id = ?',
        [id, userId],
      );
      return {
        data: result && result.length > 0 ? result[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase('tbl_transactions', 'select', null, {
        id,
        user_id: userId,
      });
    }
  }

  static async updateFinancialTransaction(
    id: string | number,
    userId: string | number,
    transactionData: any,
  ) {
    if (dbConfig.type === 'sqlite') {
      const {
        description,
        amount,
        type,
        category_id,
        transaction_date,
        installment_number,
        total_installments,
        is_recurrent,
        recurrence_start_date,
        start_date,
        payment_method,
      } = transactionData;

      // Primeiro verificar se a transação existe e pertence ao usuário
      const existing = await this.getFinancialTransactionById(id, userId);
      if (!existing || !existing.data) {
        return { data: null, error: { message: 'Transação não encontrada' } };
      }

      const result = this.querySQLite(
        `UPDATE tbl_transactions 
         SET description = ?, amount = ?, type = ?, category_id = ?, 
             transaction_date = ?, installment_number = ?, total_installments = ?, start_date = ?, is_recurrent = ?, recurrence_start_date = ?, payment_method = ?
         WHERE id = ? AND user_id = ?`,
        [
          description,
          amount,
          type,
          category_id,
          transaction_date,
          installment_number,
          total_installments,
          start_date || transaction_date,
          is_recurrent ? 1 : 0,
          recurrence_start_date || null,
          payment_method || null,
          id,
          userId,
        ],
      );

      // Buscar transação atualizada
      const updated = this.querySQLite(
        'SELECT * FROM tbl_transactions WHERE id = ?',
        [id],
      );
      return {
        data: updated && updated.length > 0 ? updated[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase(
        'tbl_transactions',
        'update',
        transactionData,
        { id, user_id: userId },
      );
    }
  }

  static async deleteFinancialTransaction(
    id: string | number,
    userId: string | number,
  ) {
    if (dbConfig.type === 'sqlite') {
      const existing = await this.getFinancialTransactionById(id, userId);
      if (!existing || !existing.data) {
        return { data: null, error: { message: 'Transação não encontrada' } };
      }

      this.querySQLite(
        'DELETE FROM tbl_transactions WHERE id = ? AND user_id = ?',
        [id, userId],
      );
      return { data: { success: true }, error: null };
    } else {
      return await this.querySupabase('tbl_transactions', 'delete', null, {
        id,
        user_id: userId,
      });
    }
  }

  static async getMonthlyTransactions(
    userId: string | number,
    year: number,
    month: number,
  ) {
    const monthStr = month.toString().padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;

    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${lastDay}`;

    if (dbConfig.type === 'sqlite') {
      const sql = `
        SELECT * FROM tbl_transactions 
        WHERE user_id = ? 
        AND (
          -- REGRA 1: Transações únicas no mês consultado
          (is_installment = 0 AND is_recurrent = 0 AND transaction_date >= ? AND transaction_date <= ?)
          
          -- REGRA 2: Transações recorrentes ativas
          -- Busca recorrentes cujo início é anterior ou igual ao final do mês
          OR (is_recurrent = 1 AND recurrence_start_date IS NOT NULL AND recurrence_start_date <= ?)
          
          -- REGRA 3: Transações Parceladas ATIVAS (CORREÇÃO AQUI)
          -- Busca parceladas cuja data de início (startDate no JSON) é anterior ou igual ao final do mês
          -- Nota: 'json_extract(installments, '$.startDate')' é o padrão SQLite para extrair do JSON.
          OR (is_installment = 1 AND json_extract(installments, '$.startDate') <= ?)
        )
        ORDER BY transaction_date ASC
      `;
      const result = this.querySQLite(sql, [
        userId,
        startDate,
        endDate,
        endDate,
        endDate,
      ]);
      return { data: result, error: null };
    } else {
      const result = await db
        .from('tbl_transactions')
        .select('*')
        .eq('user_id', userId)
        .or(
          `and(is_installment.eq.false,is_recurrent.eq.false,transaction_date.gte.${startDate},transaction_date.lte.${endDate}),` +
            `and(is_recurrent.eq.true,recurrence_start_date.not.is.null,recurrence_start_date.lte.${endDate}),` +
            `and(is_installment.eq.true,installments->>'startDate'.lte.${endDate})`,
        )
        .order('transaction_date', { ascending: true });

      return { data: result.data, error: result.error };
    }
  }

  static async getInstallmentPlans(userId: string | number) {
    if (dbConfig.type === 'sqlite') {
      const sql = `
        SELECT * FROM tbl_transactions 
        WHERE user_id = ? 
        AND total_installments > 1
        ORDER BY transaction_date ASC
      `;
      const result = this.querySQLite(sql, [userId]);

      const plans = (result || []).map((tx: any) => {
        let installments = null;
        try {
          installments = tx.installments ? JSON.parse(tx.installments) : null;
        } catch (e) {
          installments = null;
        }

        const totalInstallments =
          tx.total_installments || installments?.totalInstallments || 1;
        const paidInstallments =
          installments?.paidInstallments ?? (tx.installment_number - 1 || 0);
        const installmentAmount = tx.amount / totalInstallments;
        const startDate =
          installments?.startDate || tx.start_date || tx.transaction_date;

        return {
          id: tx.id,
          description: tx.description,
          totalAmount: tx.amount,
          installmentAmount,
          totalInstallments,
          paidInstallments,
          remainingInstallments: Math.max(
            0,
            totalInstallments - paidInstallments,
          ),
          startDate,
          status: paidInstallments >= totalInstallments ? 'concluído' : 'ativo',
          type: tx.type,
          category_id: tx.category_id,
        };
      });

      return { data: plans, error: null };
    } else {
      const result = await db
        .from('tbl_transactions')
        .select('*')
        .eq('user_id', userId)
        .gt('total_installments', 1)
        .order('transaction_date', { ascending: true });

      return { data: result.data, error: result.error };
    }
  }

  static async getShoppingLists(userId: string | number) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT * FROM tbl_shopping_lists WHERE user_id = ?',
        [userId],
      );
      return { data: result, error: null };
    } else {
      return await this.querySupabase('tbl_shopping_lists', 'select', null, {
        user_id: userId,
      });
    }
  }

  static async getShoppingListById(
    id: string | number,
    userId: string | number,
  ) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT * FROM tbl_shopping_lists WHERE id = ? AND user_id = ?',
        [id, userId],
      );
      return {
        data: result && result.length > 0 ? result[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase('tbl_shopping_lists', 'select', null, {
        id,
        user_id: userId,
      });
    }
  }

  static async getShoppingListWithItems(
    id: string | number,
    userId: string | number,
  ) {
    if (dbConfig.type === 'sqlite') {
      // Buscar a lista
      const listResult = await this.getShoppingListById(id, userId);
      if (!listResult || !listResult.data) {
        return { data: null, error: { message: 'Lista não encontrada' } };
      }

      // Buscar os itens da lista
      const itemsResult = await this.getShoppingItems(id);

      return {
        data: {
          ...listResult.data,
          items: itemsResult.data || [],
        },
        error: null,
      };
    } else {
      const result = await db
        .from('tbl_shopping_lists')
        .select('*, tbl_shopping_items(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      return { data: result.data, error: result.error };
    }
  }

  static async deleteShoppingList(
    id: string | number,
    userId: string | number,
  ) {
    if (dbConfig.type === 'sqlite') {
      // Primeiro verificar se a lista existe e pertence ao usuário
      const existing = await this.getShoppingListById(id, userId);
      if (!existing || !existing.data) {
        return { data: null, error: { message: 'Lista não encontrada' } };
      }

      // Excluir itens da lista primeiro
      this.querySQLite(
        'DELETE FROM tbl_shopping_list_items WHERE shopping_list_id = ?',
        [id],
      );

      // Excluir a lista
      this.querySQLite(
        'DELETE FROM tbl_shopping_lists WHERE id = ? AND user_id = ?',
        [id, userId],
      );

      return { data: { success: true }, error: null };
    } else {
      return await this.querySupabase('tbl_shopping_lists', 'delete', null, {
        id,
        user_id: userId,
      });
    }
  }

  //

  static async completeShoppingList(
    id: string | number,
    userId: string | number,
    listPayload: any,
  ) {
    if (dbConfig.type === 'sqlite') {
      const transaction = db.transaction(() => {
        const listCheck = db
          .prepare(
            'SELECT * FROM tbl_shopping_lists WHERE id = ? AND user_id = ?',
          )
          .get(id, userId);

        if (!listCheck) {
          throw new Error('Lista não encontrada');
        }

        if (listPayload && Array.isArray(listPayload.items)) {
          const updateItemStmt = db.prepare(
            `UPDATE tbl_shopping_list_items 
                    SET quantity = ?, price = ?, checked = ?
                    WHERE id = ? AND shopping_list_id = ?`,
          );

          for (const item of listPayload.items) {
            updateItemStmt.run(
              item.quantity,
              item.price,
              item.checked ? 1 : 0,
              item.id,
              id,
            );
          }
        }

        const items = db
          .prepare(
            'SELECT quantity, price FROM tbl_shopping_list_items WHERE shopping_list_id = ?',
          )
          .all(id);

        const totalAmount = items.reduce((sum: number, item: any) => {
          return sum + (item.quantity || 0) * (item.price || 0);
        }, 0);

        const completedAt = new Date().toISOString().split('T')[0];

        db.prepare(
          `UPDATE tbl_shopping_lists 
                SET status = 'completed', completed_at = ?, total_amount = ?
                WHERE id = ? AND user_id = ?`,
        ).run(completedAt, totalAmount, id, userId);

        const category = db
          .prepare(
            'SELECT id FROM tbl_financial_categories WHERE name = ? AND user_id = ? AND type = ?',
          )
          .get('Alimentação', userId, 'expense');

        if (!category) {
          throw new Error(
            'Categoria "Alimentação" não encontrada para o usuário.',
          );
        }
        const categoryId = category.id;

        const description = `Compras: ${listCheck.name || 'Lista'}`;
        const installmentsData = {
          totalInstallments: 1,
          paidInstallments: 1,
          startDate: completedAt,
        };
        const installmentsJson = JSON.stringify(installmentsData);

        db.prepare(
          `INSERT INTO tbl_transactions 
                (description, amount, type, category_id, user_id, transaction_date, is_installment, total_installments, installment_number, start_date, installments, is_recurrent, recurrence_start_date, payment_method) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          description,
          totalAmount,
          'expense',
          categoryId,
          userId,
          completedAt,
          0,
          1,
          1,
          completedAt,
          installmentsJson,
          0,
          null,
          null,
        );

        return db
          .prepare('SELECT * FROM tbl_shopping_lists WHERE id = ?')
          .get(id);
      });

      try {
        const updatedList = transaction();
        return { data: updatedList, error: null };
      } catch (error: any) {
        return {
          data: null,
          error: { message: error.message || 'Erro ao finalizar lista' },
        };
      }
    } else {
      const listCheckResult = await this.querySupabase(
        'tbl_shopping_lists',
        'select',
        'name',
        { id, user_id: userId },
      );

      if (
        !listCheckResult ||
        !listCheckResult.data ||
        listCheckResult.data.length === 0
      ) {
        return { data: null, error: { message: 'Lista não encontrada' } };
      }
      const listName = listCheckResult.data[0].name;

      if (listPayload && Array.isArray(listPayload.items)) {
        for (const item of listPayload.items) {
          await this.querySupabase(
            'tbl_shopping_list_items',
            'update',
            {
              quantity: item.quantity,
              price: item.price,
              checked: item.checked,
            },
            { id: item.id, shopping_list_id: id },
          );
        }
      }

      const itemsResult = await this.querySupabase(
        'tbl_shopping_list_items',
        'select',
        'quantity, price',
        { shopping_list_id: id },
      );

      if (!itemsResult) {
        return {
          data: null,
          error: { message: 'Erro ao buscar itens da lista para cálculo.' },
        };
      }

      const items = itemsResult.data || [];
      const totalAmount = items.reduce((sum: number, item: any) => {
        return sum + (item.quantity || 0) * (item.price || 0);
      }, 0);

      const completedAt = new Date().toISOString().split('T')[0];

      await this.querySupabase(
        'tbl_shopping_lists',
        'update',
        {
          status: 'completed',
          completed_at: completedAt,
          total_amount: totalAmount,
        },
        { id, user_id: userId },
      );

      const categoryResult = await this.querySupabase(
        'tbl_financial_categories',
        'select',
        'id',
        { name: 'Alimentação', user_id: userId, type: 'expense' },
      );

      if (
        !categoryResult ||
        !categoryResult.data ||
        categoryResult.data.length === 0
      ) {
        return {
          data: null,
          error: {
            message: 'Categoria "Alimentação" não encontrada para o usuário.',
          },
        };
      }
      const categoryId = categoryResult.data[0].id;

      const finalResult = await this.querySupabase(
        'tbl_shopping_lists',
        'select',
        '*',
        { id, user_id: userId },
      );

      if (!finalResult || !finalResult.data || finalResult.data.length === 0) {
        return {
          data: null,
          error: { message: 'Erro ao buscar lista atualizada após conclusão.' },
        };
      }

      return {
        data: {
          ...finalResult.data[0],
          totalAmount,
          listName,
          completedAt,
          categoryId,
        },
        error: null,
      };
    }
  }

  static async getShoppingItems(listId: string | number) {
    if (dbConfig.type === 'sqlite') {
      const sql = `
        SELECT si.*, p.name as product_name, sc.name as category_name 
        FROM tbl_shopping_list_items si
        LEFT JOIN tbl_products p ON si.product_id = p.id
        LEFT JOIN tbl_shopping_categories sc ON p.category_id = sc.id
        WHERE si.shopping_list_id = ?
      `;
      const result = this.querySQLite(sql, [listId]);
      return { data: result, error: null };
    } else {
      const result = await db
        .from('tbl_shopping_list_items')
        .select(
          `*, 
          tbl_products(name, category_id), 
          category:tbl_products(tbl_shopping_categories(name))
        `,
        )
        .eq('shopping_list_id', listId);
      // Transform result to match expected format if needed, or just return
      // Simpler Supabase query if relations are set up:
      // But for now let's just fix table name
      const result2 = await db
        .from('tbl_shopping_list_items')
        .select(
          `*, 
          tbl_products(name)
        `,
        )
        .eq('shopping_list_id', listId);
      return { data: result2.data, error: result2.error };
    }
  }

  static async createShoppingItem(itemData: any) {
    if (dbConfig.type === 'sqlite') {
      const { quantity, price, shopping_list_id, product_id } = itemData;
      const result = this.querySQLite(
        'INSERT INTO tbl_shopping_list_items (quantity, price, shopping_list_id, product_id) VALUES (?, ?, ?, ?) RETURNING *',
        [quantity, price || 0, shopping_list_id, product_id],
      );

      if (result && result.length > 0) {
        return {
          data: result[0],
          error: null,
        };
      }
      return { data: null, error: { message: 'Erro ao criar item' } };
    } else {
      return await this.querySupabase(
        'tbl_shopping_list_items',
        'insert',
        itemData,
      );
    }
  }

  static async updateShoppingItem(
    itemId: string | number,
    listId: string | number,
    userId: string | number,
    itemData: any,
  ) {
    if (dbConfig.type === 'sqlite') {
      // Verificar se o item existe e pertence à lista do usuário
      const listCheck = await this.getShoppingListById(listId, userId);
      if (!listCheck || !listCheck.data) {
        return { data: null, error: { message: 'Lista não encontrada' } };
      }

      const { quantity, price, checked } = itemData;

      this.querySQLite(
        `UPDATE tbl_shopping_list_items 
         SET quantity = ?, price = ?, checked = ?
         WHERE id = ? AND shopping_list_id = ?`,
        [quantity, price, checked ? 1 : 0, itemId, listId],
      );

      // Buscar item atualizado
      const updated = this.querySQLite(
        'SELECT * FROM tbl_shopping_list_items WHERE id = ?',
        [itemId],
      );

      return {
        data: updated && updated.length > 0 ? updated[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase(
        'tbl_shopping_list_items',
        'update',
        itemData,
        { id: itemId, shopping_list_id: listId },
      );
    }
  }

  static async deleteShoppingItem(
    itemId: string | number,
    listId: string | number,
    userId: string | number,
  ) {
    if (dbConfig.type === 'sqlite') {
      // Verificar se o item existe e pertence à lista do usuário
      const listCheck = await this.getShoppingListById(listId, userId);
      if (!listCheck || !listCheck.data) {
        return { data: null, error: { message: 'Lista não encontrada' } };
      }

      this.querySQLite(
        'DELETE FROM tbl_shopping_list_items WHERE id = ? AND shopping_list_id = ?',
        [itemId, listId],
      );

      return { data: { success: true }, error: null };
    } else {
      return await this.querySupabase(
        'tbl_shopping_list_items',
        'delete',
        null,
        {
          id: itemId,
          shopping_list_id: listId,
        },
      );
    }
  }

  static async syncShoppingList(
    listId: string | number,
    userId: string | number,
    listData: any,
  ) {
    if (dbConfig.type === 'sqlite') {
      const { name, items, status } = listData;

      console.log(name, items, status);

      const syncTransaction = db.transaction(() => {
        // 1. Verify list ownership
        const listCheck = db
          .prepare(
            'SELECT id FROM tbl_shopping_lists WHERE id = ? AND user_id = ?',
          )
          .get(listId, userId);
        if (!listCheck) {
          throw new Error('Lista não encontrada');
        }

        // 2. Update list details
        if (name || status) {
          const updateStmt = db.prepare(`
             UPDATE tbl_shopping_lists
             SET name = COALESCE(?, name),
                 status = COALESCE(?, status)
             WHERE id = ?
           `);
          updateStmt.run(name || null, status || null, listId);
        }

        // 3. Replace items
        // Delete existing
        db.prepare(
          'DELETE FROM tbl_shopping_list_items WHERE shopping_list_id = ?',
        ).run(listId);

        // Insert new
        if (items && Array.isArray(items) && items.length > 0) {
          const insertStmt = db.prepare(`
            INSERT INTO tbl_shopping_list_items (quantity, price, shopping_list_id, product_id, checked)
            VALUES (?, ?, ?, ?, ?)
          `);
          for (const item of items) {
            insertStmt.run(
              item.quantity,
              item.price || 0,
              listId,
              item.productId || item.product_id,
              item.checked ? 1 : 0,
            );
          }
        }

        // Return updated list
        return db
          .prepare('SELECT * FROM tbl_shopping_lists WHERE id = ?')
          .get(listId);
      });

      try {
        const result = syncTransaction();
        // Fetch items to return complete object
        const itemsResult = await this.getShoppingItems(listId);
        return { data: { ...result, items: itemsResult.data }, error: null };
      } catch (error: any) {
        return {
          data: null,
          error: { message: error.message || 'Erro na sincronização' },
        };
      }
    } else {
      return {
        data: null,
        error: { message: 'Sincronização não implementada para Supabase' },
      };
    }
  }

  static async addBatchShoppingItems(
    listId: string | number,
    userId: string | number,
    items: any[],
  ) {
    if (dbConfig.type === 'sqlite') {
      const batchTransaction = db.transaction(() => {
        // 1. Verify list ownership
        const listCheck = db
          .prepare(
            'SELECT id FROM tbl_shopping_lists WHERE id = ? AND user_id = ?',
          )
          .get(listId, userId);
        if (!listCheck) {
          throw new Error('Lista não encontrada');
        }

        // 2. Insert items
        const insertStmt = db.prepare(`
          INSERT INTO tbl_shopping_list_items (quantity, price, shopping_list_id, product_id, checked)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const item of items) {
          insertStmt.run(
            item.quantity,
            item.price || 0,
            listId,
            item.productId || item.product_id,
            item.checked ? 1 : 0,
          );
        }

        return true;
      });

      try {
        batchTransaction();
        const itemsResult = await this.getShoppingItems(listId);
        return { data: { items: itemsResult.data }, error: null };
      } catch (error: any) {
        return {
          data: null,
          error: {
            message: error.message || 'Erro ao adicionar itens em lote',
          },
        };
      }
    } else {
      return {
        data: null,
        error: { message: 'Batch insert não implementado para Supabase' },
      };
    }
  }

  // Métodos para Products
  static async getProducts(userId: string | number) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT * FROM tbl_products WHERE user_id = ?',
        [userId],
      );
      return { data: result, error: null };
    } else {
      return await this.querySupabase('tbl_products', 'select', null, {
        user_id: userId,
      });
    }
  }

  static async createProduct(productData: any) {
    if (dbConfig.type === 'sqlite') {
      const { name, unit, user_id, category_id } = productData;
      const result = this.querySQLite(
        'INSERT INTO tbl_products (name, unit, user_id, category_id) VALUES (?, ?, ?, ?) RETURNING *',
        [name, unit, user_id, category_id],
      );

      if (result && result.length > 0) {
        return {
          data: result[0],
          error: null,
        };
      }
      return { data: null, error: { message: 'Erro ao criar produto' } };
    } else {
      return await this.querySupabase('tbl_products', 'insert', productData);
    }
  }

  static async getProductById(id: string | number, userId: string | number) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT * FROM tbl_products WHERE id = ? AND user_id = ?',
        [id, userId],
      );
      return {
        data: result && result.length > 0 ? result[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase('tbl_products', 'select', null, {
        id,
        user_id: userId,
      });
    }
  }

  static async updateProduct(
    id: string | number,
    userId: string | number,
    productData: any,
  ) {
    if (dbConfig.type === 'sqlite') {
      // Verificar se o produto existe e pertence ao usuário
      const existing = await this.getProductById(id, userId);
      if (!existing || !existing.data) {
        return { data: null, error: { message: 'Produto não encontrado' } };
      }

      const { name, unit, category_id } = productData;

      this.querySQLite(
        `UPDATE tbl_products 
         SET name = ?, unit = ?, category_id = ?
         WHERE id = ? AND user_id = ?`,
        [name, unit, category_id, id, userId],
      );

      // Buscar produto atualizado
      const updated = this.querySQLite(
        'SELECT * FROM tbl_products WHERE id = ?',
        [id],
      );

      return {
        data: updated && updated.length > 0 ? updated[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase('tbl_products', 'update', productData, {
        id,
        user_id: userId,
      });
    }
  }

  static async checkProductDependencies(id: string | number) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT COUNT(*) as count FROM tbl_shopping_list_items WHERE product_id = ?',
        [id],
      );
      const count = result && result.length > 0 ? result[0].count : 0;
      return { data: { hasDependencies: count > 0, count }, error: null };
    } else {
      const result = await db
        .from('tbl_shopping_list_items')
        .select('id', { count: 'exact' })
        .eq('product_id', id);

      return {
        data: {
          hasDependencies: (result.count || 0) > 0,
          count: result.count || 0,
        },
        error: result.error,
      };
    }
  }

  static async deleteProduct(id: string | number, userId: string | number) {
    if (dbConfig.type === 'sqlite') {
      // Verificar se o produto existe e pertence ao usuário
      const existing = await this.getProductById(id, userId);
      if (!existing || !existing.data) {
        return { data: null, error: { message: 'Produto não encontrado' } };
      }

      // Verificar dependências
      const dependencies = await this.checkProductDependencies(id);
      if (dependencies.data?.hasDependencies) {
        return {
          data: null,
          error: {
            message:
              'Não é possível excluir o produto pois ele está sendo usado em listas de compras',
            code: 'DEPENDENCY_ERROR',
          },
        };
      }

      this.querySQLite(
        'DELETE FROM tbl_products WHERE id = ? AND user_id = ?',
        [id, userId],
      );

      return { data: { success: true }, error: null };
    } else {
      // Verificar dependências
      const dependencies = await this.checkProductDependencies(id);
      if (dependencies.data?.hasDependencies) {
        return {
          data: null,
          error: {
            message:
              'Não é possível excluir o produto pois ele está sendo usado em listas de compras',
            code: 'DEPENDENCY_ERROR',
          },
        };
      }

      return await this.querySupabase('tbl_products', 'delete', null, {
        id,
        user_id: userId,
      });
    }
  }

  // Métodos para Shopping Categories
  static async getShoppingCategories(userId: string | number) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT * FROM tbl_shopping_categories WHERE user_id = ?',
        [userId],
      );
      return { data: result, error: null };
    } else {
      return await this.querySupabase(
        'tbl_shopping_categories',
        'select',
        null,
        { user_id: userId },
      );
    }
  }

  static async createShoppingCategory(categoryData: any) {
    if (dbConfig.type === 'sqlite') {
      const { name, user_id } = categoryData;
      const result = this.querySQLite(
        'INSERT INTO tbl_shopping_categories (name, user_id) VALUES (?, ?) RETURNING *',
        [name, user_id],
      );

      if (result && result.length > 0) {
        return {
          data: result[0],
          error: null,
        };
      }
      return { data: null, error: { message: 'Erro ao criar categoria' } };
    } else {
      return await this.querySupabase(
        'tbl_shopping_categories',
        'insert',
        categoryData,
      );
    }
  }

  static async getShoppingCategoryById(
    id: string | number,
    userId: string | number,
  ) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT * FROM tbl_shopping_categories WHERE id = ? AND user_id = ?',
        [id, userId],
      );
      return {
        data: result && result.length > 0 ? result[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase(
        'tbl_shopping_categories',
        'select',
        null,
        { id, user_id: userId },
      );
    }
  }

  static async updateShoppingCategory(
    id: string | number,
    userId: string | number,
    categoryData: any,
  ) {
    if (dbConfig.type === 'sqlite') {
      // Verificar se a categoria existe e pertence ao usuário
      const existing = await this.getShoppingCategoryById(id, userId);
      if (!existing || !existing.data) {
        return { data: null, error: { message: 'Categoria não encontrada' } };
      }

      const { name } = categoryData;

      this.querySQLite(
        `UPDATE tbl_shopping_categories 
         SET name = ?
         WHERE id = ? AND user_id = ?`,
        [name, id, userId],
      );

      // Buscar categoria atualizada
      const updated = this.querySQLite(
        'SELECT * FROM tbl_shopping_categories WHERE id = ?',
        [id],
      );

      return {
        data: updated && updated.length > 0 ? updated[0] : null,
        error: null,
      };
    } else {
      return await this.querySupabase(
        'tbl_shopping_categories',
        'update',
        categoryData,
        { id, user_id: userId },
      );
    }
  }

  static async checkCategoryDependencies(id: string | number) {
    if (dbConfig.type === 'sqlite') {
      const result = this.querySQLite(
        'SELECT COUNT(*) as count FROM tbl_products WHERE category_id = ?',
        [id],
      );
      const count = result && result.length > 0 ? result[0].count : 0;
      return { data: { hasDependencies: count > 0, count }, error: null };
    } else {
      const result = await db
        .from('tbl_products')
        .select('id', { count: 'exact' })
        .eq('category_id', id);

      return {
        data: {
          hasDependencies: (result.count || 0) > 0,
          count: result.count || 0,
        },
        error: result.error,
      };
    }
  }

  static async deleteShoppingCategory(
    id: string | number,
    userId: string | number,
  ) {
    if (dbConfig.type === 'sqlite') {
      // Verificar se a categoria existe e pertence ao usuário
      const existing = await this.getShoppingCategoryById(id, userId);
      if (!existing || !existing.data) {
        return { data: null, error: { message: 'Categoria não encontrada' } };
      }

      // Verificar dependências
      const dependencies = await this.checkCategoryDependencies(id);
      if (dependencies.data?.hasDependencies) {
        return {
          data: null,
          error: {
            message:
              'Não é possível excluir a categoria pois ela está sendo usada por produtos',
            code: 'DEPENDENCY_ERROR',
          },
        };
      }

      this.querySQLite(
        'DELETE FROM tbl_shopping_categories WHERE id = ? AND user_id = ?',
        [id, userId],
      );

      return { data: { success: true }, error: null };
    } else {
      // Verificar dependências
      const dependencies = await this.checkCategoryDependencies(id);
      if (dependencies.data?.hasDependencies) {
        return {
          data: null,
          error: {
            message:
              'Não é possível excluir a categoria pois ela está sendo usada por produtos',
            code: 'DEPENDENCY_ERROR',
          },
        };
      }

      return await this.querySupabase(
        'tbl_shopping_categories',
        'delete',
        null,
        { id, user_id: userId },
      );
    }
  }

  static async getAllFinancialCategories(userId: string) {
    if (dbConfig.type === 'sqlite') {
      const sql = 'SELECT * FROM tbl_financial_categories WHERE user_id = ?';
      const result = this.querySQLite(sql, [userId]);
      return { data: result, error: null };
    } else {
      return await this.querySupabase(
        'tbl_financial_categories',
        'select',
        null,
        { user_id: userId },
      );
    }
  }

  static async createShoppingList(listData: any) {
    const { name, items = [], user_id } = listData;

    if (dbConfig.type === 'sqlite') {
      try {
        this.querySQLite(
          `INSERT INTO tbl_shopping_lists (name, user_id, status, created_at)
         VALUES (?, ?, 'pending', datetime('now'))`,
          [name, user_id],
        );

        const listResult = this.querySQLite(
          `SELECT * FROM tbl_shopping_lists WHERE rowid = last_insert_rowid()`,
        );

        if (!listResult || listResult.length === 0) {
          return { data: null, error: { message: 'Erro ao criar lista' } };
        }

        const list = listResult[0];

        if (!items || items.length === 0) {
          return { data: { ...list, items: [] }, error: null };
        }

        const createdItems: any[] = [];

        for (const product_id of items) {
          const productCheck = this.querySQLite(
            `SELECT * FROM tbl_products WHERE id = ? AND user_id = ?`,
            [product_id, user_id],
          );

          if (!productCheck || productCheck.length === 0) {
            this.querySQLite(
              'DELETE FROM tbl_shopping_list_items WHERE shopping_list_id = ?',
              [list.id],
            );
            this.querySQLite('DELETE FROM tbl_shopping_lists WHERE id = ?', [
              list.id,
            ]);

            return {
              data: null,
              error: { message: `Produto não encontrado: ${product_id}` },
            };
          }

          this.querySQLite(
            `INSERT INTO tbl_shopping_list_items
           (shopping_list_id, product_id, quantity, price, checked)
           VALUES (?, ?, 1, 0.00, 0)`,
            [list.id, product_id],
          );

          const itemResult = this.querySQLite(
            `SELECT * FROM tbl_shopping_list_items WHERE rowid = last_insert_rowid()`,
          );

          if (!itemResult || itemResult.length === 0) {
            this.querySQLite(
              'DELETE FROM tbl_shopping_list_items WHERE shopping_list_id = ?',
              [list.id],
            );
            this.querySQLite('DELETE FROM tbl_shopping_lists WHERE id = ?', [
              list.id,
            ]);

            return { data: null, error: { message: 'Erro ao criar item' } };
          }

          createdItems.push(itemResult[0]);
        }

        return { data: { ...list, items: createdItems }, error: null };
      } catch (error) {
        return { data: null, error: { message: 'Erro ao criar lista' } };
      }
    }

    const listInsert = await this.querySupabase(
      'tbl_shopping_lists',
      'insert',
      {
        name,
        user_id,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    );

    if (!listInsert || listInsert.error || !listInsert.data?.[0]) {
      return {
        data: null,
        error: listInsert?.error ?? { message: 'Erro ao criar lista' },
      };
    }

    const list = listInsert.data[0];

    if (!items || items.length === 0) {
      return { data: { ...list, items: [] }, error: null };
    }

    for (const product_id of items) {
      const productCheck = await this.querySupabase(
        'tbl_products',
        'select',
        null,
        { id: product_id, user_id },
      );

      if (
        !productCheck ||
        !productCheck.data ||
        productCheck.data.length === 0
      ) {
        await this.querySupabase('tbl_shopping_lists', 'delete', null, {
          id: list.id,
          user_id,
        });

        return {
          data: null,
          error: { message: `Produto não encontrado: ${product_id}` },
        };
      }
    }

    const supabaseInsertItems = await this.querySupabase(
      'tbl_shopping_list_items',
      'insert',
      items.map((product_id: string) => ({
        shopping_list_id: list.id,
        product_id,
        quantity: 1,
        price: 0,
        checked: false,
        user_id,
      })),
    );

    if (!supabaseInsertItems || supabaseInsertItems.error) {
      await this.querySupabase('tbl_shopping_lists', 'delete', null, {
        id: list.id,
        user_id,
      });

      return {
        data: null,
        error: supabaseInsertItems?.error ?? { message: 'Erro ao criar itens' },
      };
    }

    return {
      data: { ...list, items: supabaseInsertItems.data || [] },
      error: null,
    };
  }

  static getConfig() {
    return dbConfig;
  }

  static getDatabase() {
    return db;
  }
}
