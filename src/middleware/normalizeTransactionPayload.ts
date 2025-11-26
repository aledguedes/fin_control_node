import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para normalizar o payload de transações financeiras.
 * Garante que os campos estejam corretos para os cenários: única, recorrente, parcelada.
 */
export function normalizeTransactionPayload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Validação de nomes de atributos: rejeita camelCase para campos esperados em snake_case
  const forbiddenCamelCase = [
    'paymentMethod',
    'isInstallment',
    'isRecurrent',
    'transactionDate',
    'recurrenceStartDate',
    'categoryId',
    'paidInstallments',
    'totalInstallments',
    'startDate',
  ];
  for (const key of Object.keys(req.body)) {
    if (forbiddenCamelCase.includes(key)) {
      return res.status(400).json({
        error: `Atributo '${key}' deve estar em snake_case (ex: payment_method)`,
      });
    }
  }
  if (req.body.installments && typeof req.body.installments === 'object') {
    for (const key of Object.keys(req.body.installments)) {
      if (forbiddenCamelCase.includes(key)) {
        return res.status(400).json({
          error: `Atributo installments.${key} deve estar em snake_case (ex: total_installments)`,
        });
      }
    }
  }
  const {
    is_installment,
    is_recurrent,
    transaction_date,
    recurrence_start_date,
    installments,
  } = req.body;

  // Inicializa installments se não vier
  req.body.installments = installments || {};

  // Cenário 1: Única
  if (!is_installment && !is_recurrent) {
    req.body.installments.total_installments = 1;
    req.body.installments.paid_installments = 1;
    req.body.installments.start_date = transaction_date;
    req.body.recurrence_start_date = undefined;
  }

  // Cenário 2: Recorrente
  if (!is_installment && is_recurrent) {
    req.body.installments.total_installments = 1;
    req.body.installments.paid_installments = 1;
    req.body.installments.start_date = recurrence_start_date;
  }

  // Cenário 3: Parcelada
  if (is_installment && !is_recurrent) {
    // Remove recurrence_start_date se vier no payload
    if ('recurrence_start_date' in req.body) {
      delete req.body.recurrence_start_date;
    }
    // Garante que start_date seja igual à transaction_date se não vier
    if (!req.body.installments.start_date) {
      req.body.installments.start_date = transaction_date;
    }
    // Garante que paid_installments exista
    if (typeof req.body.installments.paid_installments !== 'number') {
      req.body.installments.paid_installments = 0;
    }
  }

  next();
}
