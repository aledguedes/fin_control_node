import { validateRequest, validateQuery } from '../validation';
import { registerSchema, loginSchema, transactionSchema, monthlyViewQuerySchema } from '../validation/schemas';
import { createError } from '../middleware/errorHandler';

describe('Validation Middleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      body: {},
      query: {}
    };
    res = {};
    next = jest.fn();
  });

  describe('validateRequest', () => {
    it('should pass validation with valid data', () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const middleware = validateRequest(registerSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should fail validation with invalid data', () => {
      req.body = {
        email: 'invalid-email',
        password: '123'
      };

      const middleware = validateRequest(registerSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.messages).toContain('"email" must be a valid email');
      // Verificar se há mensagens de erro adicionais (como a do password)
      expect(error.messages.length).toBeGreaterThan(0);
    });
  });

  describe('validateQuery', () => {
    it('should pass validation with valid query parameters', () => {
      req.query = {
        year: '2024',
        month: '12'
      };

      const middleware = validateQuery(monthlyViewQuerySchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(); // Should be called with no arguments (no error)
    });

    it('should fail validation with invalid query parameters', () => {
      req.query = {
        year: 'invalid',
        month: '13'
      };

      const middleware = validateQuery(monthlyViewQuerySchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
    });
  });
});