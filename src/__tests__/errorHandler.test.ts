import { createError, errorHandler } from '../middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';

describe('Error Handler', () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('createError', () => {
    it('should create error with message and status code', () => {
      const error = createError('Test error', 404);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.messages).toBeUndefined();
    });

    it('should create error with message, status code and messages array', () => {
      const messages = ['Field 1 is required', 'Field 2 is invalid'];
      const error = createError('Validation failed', 400, messages);
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.messages).toEqual(messages);
    });
  });

  describe('errorHandler', () => {
    it('should handle error with status code and message', () => {
      const error = createError('Not found', 404);
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found'
      });
    });

    it('should handle error with messages array', () => {
      const messages = ['Field 1 is required', 'Field 2 is invalid'];
      const error = createError('Validation failed', 400, messages);
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        messages: messages
      });
    });

    it('should handle internal server error by default', () => {
      const error = new Error('Something went wrong');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Something went wrong'
      });
    });
  });
});