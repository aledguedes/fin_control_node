import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../server';
import { validateRequest } from '../validation';
import { registerSchema, loginSchema } from '../validation/schemas';
import { createError } from '../middleware/errorHandler';
import { User } from '../types';

const router = express.Router();

// Registro de usuário
router.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('tbl_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return next(createError('Usuário já existe', 409));
    }

    // Hash da senha
    const saltRounds = parseInt(process.env['BCRYPT_ROUNDS'] || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const { data: newUser, error } = await supabase
      .from('tbl_users')
      .insert([{
        email,
        password: hashedPassword
      }])
      .select('id, email, created_at')
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return next(createError('Erro ao criar usuário', 500));
    }

    // Gerar token JWT
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      return next(createError('Configuração JWT não encontrada', 500));
    }
    
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      jwtSecret,
      { expiresIn: process.env['JWT_EXPIRES_IN'] || '24h' } as any
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const { data: user, error } = await supabase
      .from('tbl_users')
      .select('id, email, password')
      .eq('email', email)
      .single();

    if (error || !user) {
      return next(createError('Credenciais inválidas', 401));
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createError('Credenciais inválidas', 401));
    }

    // Gerar token JWT
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      return next(createError('Configuração JWT não encontrada', 500));
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: process.env['JWT_EXPIRES_IN'] || '24h' } as any
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

export default router;