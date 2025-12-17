-- Add recurrence support to tbl_transactions
ALTER TABLE IF EXISTS tbl_transactions
  ADD COLUMN IF NOT EXISTS is_recurrent BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS tbl_transactions
  ADD COLUMN IF NOT EXISTS recurrence_start_date DATE;

-- Indexes for recurrence
CREATE INDEX IF NOT EXISTS idx_transactions_is_recurrent ON tbl_transactions(is_recurrent);
CREATE INDEX IF NOT EXISTS idx_transactions_recurrence_start_date ON tbl_transactions(recurrence_start_date);
