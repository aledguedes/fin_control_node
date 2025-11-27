import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para normalizar o payload de produtos.
 * Converte categoryId (camelCase) para category_id (snake_case).
 */
export function normalizeProductPayload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if ('categoryId' in req.body && !('category_id' in req.body)) {
    req.body.category_id = req.body.categoryId;
    delete req.body.categoryId;
  }
  // Opcional: rejeitar outros campos camelCase
  const forbiddenCamelCase = ['categoryId'];
  for (const key of Object.keys(req.body)) {
    if (forbiddenCamelCase.includes(key)) {
      return res.status(400).json({
        error: `Atributo '${key}' deve estar em snake_case (ex: category_id)`,
      });
    }
  }
  next();
}
