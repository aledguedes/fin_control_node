-- Add missing installment columns to tbl_transactions
-- This migration adds columns that were present in SQLite but missing in Supabase

ALTER TABLE IF EXISTS tbl_transactions
  ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT 1;

ALTER TABLE IF EXISTS tbl_transactions
  ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;

ALTER TABLE IF EXISTS tbl_transactions
  ADD COLUMN IF NOT EXISTS parent_transaction_id UUID REFERENCES tbl_transactions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS tbl_transactions
  ADD COLUMN IF NOT EXISTS paid_installments INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS tbl_transactions
  ADD COLUMN IF NOT EXISTS start_date DATE;

-- Make payment_method nullable if it's not already
ALTER TABLE IF EXISTS tbl_transactions
  ALTER COLUMN payment_method DROP NOT NULL;

-- Indexes for installment columns
CREATE INDEX IF NOT EXISTS idx_transactions_total_installments ON tbl_transactions(total_installments);
CREATE INDEX IF NOT EXISTS idx_transactions_start_date ON tbl_transactions(start_date);
CREATE INDEX IF NOT EXISTS idx_transactions_parent_transaction_id ON tbl_transactions(parent_transaction_id);

