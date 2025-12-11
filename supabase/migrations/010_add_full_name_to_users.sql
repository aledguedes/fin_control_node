-- Add full_name column to tbl_users if it doesn't exist
ALTER TABLE IF EXISTS tbl_users
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

