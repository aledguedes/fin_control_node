import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const transactionSchema = Joi.object({
  description: Joi.string().required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('revenue', 'expense').required(),
  date: Joi.date().iso().required(),
  payment_method: Joi.string().required(),
  is_installment: Joi.boolean().required(),
  category_id: Joi.string().uuid().required(),
  installments: Joi.when('is_installment', {
    is: true,
    then: Joi.object({
      total_installments: Joi.number().integer().min(2).max(48).required(),
      paid_installments: Joi.number().integer().min(0).max(Joi.ref('total_installments')).required(),
      start_date: Joi.date().iso().required()
    }).required(),
    otherwise: Joi.forbidden()
  })
});

export const financialCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('revenue', 'expense').required()
});

export const shoppingListSchema = Joi.object({
  name: Joi.string().min(1).max(200).required()
});

export const shoppingListItemSchema = Joi.object({
  quantity: Joi.number().positive().required(),
  price: Joi.number().positive().required(),
  product_id: Joi.string().uuid().required()
});

export const productSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  unit: Joi.string().valid('un', 'kg', 'l', 'dz', 'm', 'cx').required(),
  category_id: Joi.string().uuid().required()
});

export const shoppingCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required()
});

export const monthlyViewQuerySchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2030).required(),
  month: Joi.number().integer().min(1).max(12).required()
});