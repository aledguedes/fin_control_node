-- =====================================================
-- Script para aplicar migrations faltantes no banco existente
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- Migration 009: Add missing installment columns to tbl_transactions
-- =====================================================

-- Add installment_number if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tbl_transactions' 
    AND column_name = 'installment_number'
  ) THEN
    ALTER TABLE tbl_transactions ADD COLUMN installment_number INTEGER DEFAULT 1;
    RAISE NOTICE 'Added column installment_number to tbl_transactions';
  END IF;
END $$;

-- Add total_installments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tbl_transactions' 
    AND column_name = 'total_installments'
  ) THEN
    ALTER TABLE tbl_transactions ADD COLUMN total_installments INTEGER DEFAULT 1;
    RAISE NOTICE 'Added column total_installments to tbl_transactions';
  END IF;
END $$;

-- Add parent_transaction_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tbl_transactions' 
    AND column_name = 'parent_transaction_id'
  ) THEN
    ALTER TABLE tbl_transactions 
      ADD COLUMN parent_transaction_id UUID 
      REFERENCES tbl_transactions(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added column parent_transaction_id to tbl_transactions';
  END IF;
END $$;

-- Add paid_installments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tbl_transactions' 
    AND column_name = 'paid_installments'
  ) THEN
    ALTER TABLE tbl_transactions ADD COLUMN paid_installments INTEGER DEFAULT 0;
    RAISE NOTICE 'Added column paid_installments to tbl_transactions';
  END IF;
END $$;

-- Add start_date if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tbl_transactions' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE tbl_transactions ADD COLUMN start_date DATE;
    RAISE NOTICE 'Added column start_date to tbl_transactions';
  END IF;
END $$;

-- Make payment_method nullable if it's not already
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tbl_transactions' 
    AND column_name = 'payment_method'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE tbl_transactions ALTER COLUMN payment_method DROP NOT NULL;
    RAISE NOTICE 'Made payment_method nullable in tbl_transactions';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_transactions_total_installments 
  ON tbl_transactions(total_installments);

CREATE INDEX IF NOT EXISTS idx_transactions_start_date 
  ON tbl_transactions(start_date);

CREATE INDEX IF NOT EXISTS idx_transactions_parent_transaction_id 
  ON tbl_transactions(parent_transaction_id);

-- Migration 010: Add full_name to tbl_users
-- =====================================================

-- Add full_name if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tbl_users' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE tbl_users ADD COLUMN full_name VARCHAR(255);
    RAISE NOTICE 'Added column full_name to tbl_users';
  END IF;
END $$;

-- =====================================================
-- Verificação final - mostra as colunas adicionadas
-- =====================================================

-- Verificar colunas de tbl_transactions
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tbl_transactions' 
  AND column_name IN (
    'installment_number', 
    'total_installments', 
    'parent_transaction_id', 
    'paid_installments', 
    'start_date',
    'payment_method'
  )
ORDER BY column_name;

-- Verificar colunas de tbl_users
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tbl_users' 
  AND column_name = 'full_name';

