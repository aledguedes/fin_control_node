import express from 'express';
import { supabase } from '../server';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../validation';
import { 
  shoppingListSchema, 
  shoppingListItemSchema,
  productSchema,
  shoppingCategorySchema
} from '../validation/schemas';
import { createError } from '../middleware/errorHandler';
import { ShoppingList, ShoppingListWithItems, Product, ShoppingCategory } from '../types';

const router = express.Router();

// Todas as rotas de compras precisam de autenticação
router.use(authenticateToken);

// CRUD de listas de compras
router.get('/lists', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: lists, error } = await supabase
      .from('tbl_shopping_lists')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return next(createError('Erro ao buscar listas', 500));
    }

    res.json(lists);
  } catch (error) {
    next(error);
  }
});

router.get('/lists/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data: list, error: listError } = await supabase
      .from('tbl_shopping_lists')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (listError || !list) {
      return next(createError('Lista não encontrada', 404));
    }

    const { data: items, error: itemsError } = await supabase
      .from('tbl_shopping_list_items')
      .select(`
        *,
        tbl_products (*)
      `)
      .eq('shopping_list_id', id);

    if (itemsError) {
      return next(createError('Erro ao buscar itens da lista', 500));
    }

    const listWithItems: ShoppingListWithItems = {
      ...list,
      items: items?.map(item => ({
        ...item,
        product: item.tbl_products
      })) || []
    };

    res.json(listWithItems);
  } catch (error) {
    next(error);
  }
});

router.post('/lists', validateRequest(shoppingListSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const listData = {
      ...req.body,
      user_id: req.user!.id,
      status: 'andamento'
    };

    const { data: list, error } = await supabase
      .from('tbl_shopping_lists')
      .insert([listData])
      .select('*')
      .single();

    if (error) {
      return next(createError('Erro ao criar lista', 500));
    }

    res.status(201).json(list);
  } catch (error) {
    next(error);
  }
});

router.delete('/lists/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Verificar se a lista existe e pertence ao usuário
    const { data: existingList } = await supabase
      .from('tbl_shopping_lists')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingList) {
      return next(createError('Lista não encontrada', 404));
    }

    // Excluir itens da lista primeiro
    const { error: deleteItemsError } = await supabase
      .from('tbl_shopping_list_items')
      .delete()
      .eq('shopping_list_id', id);

    if (deleteItemsError) {
      return next(createError('Erro ao excluir itens da lista', 500));
    }

    // Excluir a lista
    const { error: deleteListError } = await supabase
      .from('tbl_shopping_lists')
      .delete()
      .eq('id', id);

    if (deleteListError) {
      return next(createError('Erro ao excluir lista', 500));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Finalizar lista de compras
router.post('/lists/:id/complete', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Buscar itens da lista
    const { data: items, error: itemsError } = await supabase
      .from('tbl_shopping_list_items')
      .select('*')
      .eq('shopping_list_id', id);

    if (itemsError) {
      return next(createError('Erro ao buscar itens da lista', 500));
    }

    // Calcular valor total
    const totalAmount = items?.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0) || 0;

    // Atualizar lista como finalizada
    const { data: list, error: updateError } = await supabase
      .from('tbl_shopping_lists')
      .update({
        status: 'finalizada',
        completed_at: new Date().toISOString(),
        total_amount: totalAmount
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select('*')
      .single();

    if (updateError || !list) {
      return next(createError('Erro ao finalizar lista', 500));
    }

    res.json(list);
  } catch (error) {
    next(error);
  }
});

// CRUD de itens da lista
router.post('/lists/:listId/items', validateRequest(shoppingListItemSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { listId } = req.params;
    const itemData = {
      ...req.body,
      shopping_list_id: listId,
      checked: false
    };

    // Verificar se a lista existe e pertence ao usuário
    const { data: list } = await supabase
      .from('tbl_shopping_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', req.user!.id)
      .single();

    if (!list) {
      return next(createError('Lista não encontrada', 404));
    }

    // Verificar se o produto existe e pertence ao usuário
    const { data: product } = await supabase
      .from('tbl_products')
      .select('id')
      .eq('id', itemData.product_id)
      .eq('user_id', req.user!.id)
      .single();

    if (!product) {
      return next(createError('Produto não encontrado', 404));
    }

    const { data: item, error } = await supabase
      .from('tbl_shopping_list_items')
      .insert([itemData])
      .select('*')
      .single();

    if (error) {
      return next(createError('Erro ao adicionar item', 500));
    }

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/lists/:listId/items/:itemId', validateRequest(shoppingListItemSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { listId, itemId } = req.params;
    const { quantity, price, product_id } = req.body;

    // Verificar se o item existe e pertence à lista do usuário
    const { data: existingItem } = await supabase
      .from('tbl_shopping_list_items')
      .select('id')
      .eq('id', itemId)
      .eq('shopping_list_id', listId)
      .single();

    if (!existingItem) {
      return next(createError('Item não encontrado', 404));
    }

    // Verificar se a lista pertence ao usuário
    const { data: list } = await supabase
      .from('tbl_shopping_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', req.user!.id)
      .single();

    if (!list) {
      return next(createError('Lista não encontrada', 404));
    }

    // Verificar se o novo produto existe e pertence ao usuário
    const { data: product } = await supabase
      .from('tbl_products')
      .select('id')
      .eq('id', product_id)
      .eq('user_id', req.user!.id)
      .single();

    if (!product) {
      return next(createError('Produto não encontrado', 404));
    }

    const { data: item, error } = await supabase
      .from('tbl_shopping_list_items')
      .update({
        quantity,
        price,
        product_id
      })
      .eq('id', itemId)
      .select('*')
      .single();

    if (error) {
      return next(createError('Erro ao atualizar item', 500));
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/lists/:listId/items/:itemId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { listId, itemId } = req.params;

    // Verificar se o item existe e pertence à lista do usuário
    const { data: existingItem } = await supabase
      .from('tbl_shopping_list_items')
      .select('id')
      .eq('id', itemId)
      .eq('shopping_list_id', listId)
      .single();

    if (!existingItem) {
      return next(createError('Item não encontrado', 404));
    }

    // Verificar se a lista pertence ao usuário
    const { data: list } = await supabase
      .from('tbl_shopping_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', req.user!.id)
      .single();

    if (!list) {
      return next(createError('Lista não encontrada', 404));
    }

    const { error } = await supabase
      .from('tbl_shopping_list_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      return next(createError('Erro ao excluir item', 500));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// CRUD de produtos
router.get('/products', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: products, error } = await supabase
      .from('tbl_products')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('name', { ascending: true });

    if (error) {
      return next(createError('Erro ao buscar produtos', 500));
    }

    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.post('/products', validateRequest(productSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const productData = {
      ...req.body,
      user_id: req.user!.id
    };

    // Verificar se a categoria existe e pertence ao usuário
    const { data: category } = await supabase
      .from('tbl_shopping_categories')
      .select('id')
      .eq('id', productData.category_id)
      .eq('user_id', req.user!.id)
      .single();

    if (!category) {
      return next(createError('Categoria não encontrada', 404));
    }

    const { data: product, error } = await supabase
      .from('tbl_products')
      .insert([productData])
      .select('*')
      .single();

    if (error) {
      return next(createError('Erro ao criar produto', 500));
    }

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put('/products/:id', validateRequest(productSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { name, unit, category_id } = req.body;

    // Verificar se o produto existe e pertence ao usuário
    const { data: existingProduct } = await supabase
      .from('tbl_products')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingProduct) {
      return next(createError('Produto não encontrado', 404));
    }

    // Verificar se a nova categoria existe e pertence ao usuário
    const { data: category } = await supabase
      .from('tbl_shopping_categories')
      .select('id')
      .eq('id', category_id)
      .eq('user_id', req.user!.id)
      .single();

    if (!category) {
      return next(createError('Categoria não encontrada', 404));
    }

    // Verificar se há listas de compras usando este produto
    const { data: existingItems } = await supabase
      .from('tbl_shopping_list_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (existingItems && existingItems.length > 0) {
      return next(createError('Não é possível alterar o produto pois ele está sendo usado em listas de compras', 409));
    }

    const { data: product, error } = await supabase
      .from('tbl_products')
      .update({
        name,
        unit,
        category_id
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return next(createError('Erro ao atualizar produto', 500));
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete('/products/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Verificar se o produto existe e pertence ao usuário
    const { data: existingProduct } = await supabase
      .from('tbl_products')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingProduct) {
      return next(createError('Produto não encontrado', 404));
    }

    // Verificar se há listas de compras usando este produto
    const { data: existingItems } = await supabase
      .from('tbl_shopping_list_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (existingItems && existingItems.length > 0) {
      return next(createError('Não é possível excluir o produto pois ele está sendo usado em listas de compras', 409));
    }

    const { error } = await supabase
      .from('tbl_products')
      .delete()
      .eq('id', id);

    if (error) {
      return next(createError('Erro ao excluir produto', 500));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// CRUD de categorias de compras
router.get('/categories', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: categories, error } = await supabase
      .from('tbl_shopping_categories')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('name', { ascending: true });

    if (error) {
      return next(createError('Erro ao buscar categorias', 500));
    }

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.post('/categories', validateRequest(shoppingCategorySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const categoryData = {
      ...req.body,
      user_id: req.user!.id
    };

    const { data: category, error } = await supabase
      .from('tbl_shopping_categories')
      .insert([categoryData])
      .select('*')
      .single();

    if (error) {
      return next(createError('Erro ao criar categoria', 500));
    }

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.put('/categories/:id', validateRequest(shoppingCategorySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Verificar se a categoria existe e pertence ao usuário
    const { data: existingCategory } = await supabase
      .from('tbl_shopping_categories')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingCategory) {
      return next(createError('Categoria não encontrada', 404));
    }

    // Verificar se há produtos usando esta categoria
    const { data: existingProducts } = await supabase
      .from('tbl_products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      return next(createError('Não é possível alterar a categoria pois ela está sendo usada por produtos', 409));
    }

    const { data: category, error } = await supabase
      .from('tbl_shopping_categories')
      .update({ name })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return next(createError('Erro ao atualizar categoria', 500));
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Verificar se a categoria existe e pertence ao usuário
    const { data: existingCategory } = await supabase
      .from('tbl_shopping_categories')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingCategory) {
      return next(createError('Categoria não encontrada', 404));
    }

    // Verificar se há produtos usando esta categoria
    const { data: existingProducts } = await supabase
      .from('tbl_products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      return next(createError('Não é possível excluir a categoria pois ela está sendo usada por produtos', 409));
    }

    const { error } = await supabase
      .from('tbl_shopping_categories')
      .delete()
      .eq('id', id);

    if (error) {
      return next(createError('Erro ao excluir categoria', 500));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;