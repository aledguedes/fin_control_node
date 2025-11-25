import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(createError('Token de autenticação não fornecido', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env['JWT_SECRET'] || '') as {
      userId: string;
      email: string;
    };

    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    return next(createError('Token inválido ou expirado', 403));
  }
};