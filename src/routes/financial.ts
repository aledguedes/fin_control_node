import express from 'express';
import { supabase } from '../server';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest, validateQuery } from '../validation';
import { 
  transactionSchema, 
  financialCategorySchema,
  monthlyViewQuerySchema 
} from '../validation/schemas';
import { createError } from '../middleware/errorHandler';
import { Transaction, FinancialCategory, InstallmentEntry, InstallmentPlan } from '../types';
import { format, isAfter, isBefore, addMonths, parseISO } from 'date-fns';

const router = express.Router();

// Todas as rotas financeiras precisam de autenticação
router.use(authenticateToken);

// CRUD de transações
router.get('/transactions', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: transactions, error } = await supabase
      .from('tbl_transactions')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('date', { ascending: false });

    if (error) {
      return next(createError('Erro ao buscar transações', 500));
    }

    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.post('/transactions', validateRequest(transactionSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const transactionData = {
      ...req.body,
      user_id: req.user!.id,
      is_installment: req.body.isInstallment,
      category_id: req.body.categoryId
    };

    // Verificar se a categoria existe e pertence ao usuário
    const { data: category } = await supabase
      .from('tbl_financial_categories')
      .select('id')
      .eq('id', transactionData.category_id)
      .eq('user_id', req.user!.id)
      .single();

    if (!category) {
      return next(createError('Categoria não encontrada', 404));
    }

    const { data: transaction, error } = await supabase
      .from('tbl_transactions')
      .insert([transactionData])
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao criar transação:', error);
      return next(createError('Erro ao criar transação', 500));
    }

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

router.put('/transactions/:id', validateRequest(transactionSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const transactionData = {
      ...req.body,
      is_installment: req.body.isInstallment,
      category_id: req.body.categoryId
    };

    // Verificar se a transação existe e pertence ao usuário
    const { data: existingTransaction } = await supabase
      .from('tbl_transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingTransaction) {
      return next(createError('Transação não encontrada', 404));
    }

    // Verificar se a categoria existe e pertence ao usuário
    const { data: category } = await supabase
      .from('tbl_financial_categories')
      .select('id')
      .eq('id', transactionData.category_id)
      .eq('user_id', req.user!.id)
      .single();

    if (!category) {
      return next(createError('Categoria não encontrada', 404));
    }

    const { data: transaction, error } = await supabase
      .from('tbl_transactions')
      .update(transactionData)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select('*')
      .single();

    if (error) {
      return next(createError('Erro ao atualizar transação', 500));
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

router.delete('/transactions/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tbl_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      return next(createError('Erro ao excluir transação', 500));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// CRUD de categorias financeiras
router.get('/categories', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { data: categories, error } = await supabase
      .from('tbl_financial_categories')
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

router.post('/categories', validateRequest(financialCategorySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const categoryData = {
      ...req.body,
      user_id: req.user!.id
    };

    const { data: category, error } = await supabase
      .from('tbl_financial_categories')
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

// Endpoint de negócio: Visão mensal
router.get('/summary/monthly-view', validateQuery(monthlyViewQuerySchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { year, month } = req.query;
    const userId = req.user!.id;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = format(addMonths(parseISO(startDate), 1), 'yyyy-MM-dd');

    // Buscar transações únicas do mês
    const { data: singleTransactions } = await supabase
      .from('tbl_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_installment', false)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date', { ascending: true });

    // Buscar transações parceladas ativas
    const { data: installmentTransactions } = await supabase
      .from('tbl_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_installment', true)
      .order('date', { ascending: true });

    const monthlyEntries: (Transaction | InstallmentEntry)[] = [];

    // Adicionar transações únicas
    if (singleTransactions) {
      monthlyEntries.push(...singleTransactions);
    }

    // Gerar entradas de parcelas para o mês
    if (installmentTransactions) {
      installmentTransactions.forEach(transaction => {
        if (transaction.installments) {
          const installmentEntries = generateInstallmentEntriesForMonth(
            transaction,
            parseInt(year as string),
            parseInt(month as string)
          );
          monthlyEntries.push(...installmentEntries);
        }
      });
    }

    // Ordenar por data
    monthlyEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json(monthlyEntries);
  } catch (error) {
    next(error);
  }
});

// Endpoint de negócio: Planos de parcelamento
router.get('/summary/installment-plans', async (req: AuthenticatedRequest, res, next): Promise<void> => {
  try {
    const { data: installmentTransactions } = await supabase
      .from('tbl_transactions')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('is_installment', true)
      .order('date', { ascending: true });

    if (!installmentTransactions) {
      res.json([]);
      return;
    }

    const installmentPlans: InstallmentPlan[] = installmentTransactions.map(transaction => {
      const installments = transaction.installments!;
      const monthlyAmount = transaction.amount / installments.total_installments;
      const paidAmount = monthlyAmount * installments.paid_installments;
      const pendingAmount = transaction.amount - paidAmount;

      let status: 'active' | 'overdue' | 'completed' = 'active';
      
      if (installments.paid_installments >= installments.total_installments) {
        status = 'completed';
      } else {
        const lastPaymentDate = addMonths(
          parseISO(installments.start_date),
          installments.paid_installments - 1
        );
        const today = new Date();
        
        if (isBefore(lastPaymentDate, today) && installments.paid_installments < installments.total_installments) {
          status = 'overdue';
        }
      }

      const endDate = addMonths(
        parseISO(installments.start_date),
        installments.total_installments - 1
      );

      return {
        id: transaction.id,
        description: transaction.description,
        total_amount: transaction.amount,
        type: transaction.type,
        payment_method: transaction.payment_method,
        category_id: transaction.category_id,
        user_id: transaction.user_id,
        status,
        total_installments: installments.total_installments,
        paid_installments: installments.paid_installments,
        paid_amount: parseFloat(paidAmount.toFixed(2)),
        pending_amount: parseFloat(pendingAmount.toFixed(2)),
        start_date: installments.start_date,
        end_date: format(endDate, 'yyyy-MM-dd'),
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      };
    });

    res.json(installmentPlans);
  } catch (error) {
    next(error);
  }
});

// Função auxiliar para gerar entradas de parcelas
function generateInstallmentEntriesForMonth(
  transaction: Transaction,
  year: number,
  month: number
): InstallmentEntry[] {
  const entries: InstallmentEntry[] = [];
  const installments = transaction.installments!;
  
  for (let i = 0; i < installments.total_installments; i++) {
    const installmentDate = addMonths(parseISO(installments.start_date), i);
    const installmentMonth = installmentDate.getMonth() + 1;
    const installmentYear = installmentDate.getFullYear();
    
    if (installmentYear === year && installmentMonth === month) {
      const monthlyAmount = transaction.amount / installments.total_installments;
      
      entries.push({
        id: `${transaction.id}-installment-${i + 1}`,
        description: `${transaction.description} (${i + 1}/${installments.total_installments})`,
        amount: parseFloat(monthlyAmount.toFixed(2)),
        type: transaction.type,
        date: format(installmentDate, 'yyyy-MM-dd'),
        payment_method: transaction.payment_method,
        category_id: transaction.category_id,
        user_id: transaction.user_id,
        installment_number: i + 1,
        total_installments: installments.total_installments,
        parent_transaction_id: transaction.id
      });
    }
  }
  
  return entries;
}

export default router;