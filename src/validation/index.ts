import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from '../middleware/errorHandler';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const messages = error.details.map(detail => detail.message);
      return next(createError('Validação falhou', 400, messages));
    }
    
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const messages = error.details.map(detail => detail.message);
      return next(createError('Validação de query falhou', 400, messages));
    }
    
    next();
  };
};