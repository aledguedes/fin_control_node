import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  messages?: string[] | undefined;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  const messages = err.messages || [];

  console.error(`[ERROR] ${req.method} ${req.path} - ${statusCode}:`, {
    message,
    messages,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    error: message,
    messages: messages.length > 0 ? messages : undefined,
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack })
  });
};

export const createError = (
  message: string,
  statusCode: number,
  messages?: string[],
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.messages = messages;
  return error;
};
