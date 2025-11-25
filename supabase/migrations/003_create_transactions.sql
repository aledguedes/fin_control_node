-- Criar tabela de transações financeiras
CREATE TABLE IF NOT EXISTS tbl_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  type VARCHAR(10) NOT NULL CHECK (type IN ('revenue', 'expense')),
  transaction_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  is_installment BOOLEAN DEFAULT FALSE,
  category_id UUID NOT NULL REFERENCES tbl_financial_categories(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES tbl_users(id) ON DELETE CASCADE,
  installments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON tbl_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON tbl_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON tbl_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON tbl_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_is_installment ON tbl_transactions(is_installment);

-- Enable Row Level Security
ALTER TABLE tbl_transactions ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança
CREATE POLICY "Users can only manage their own transactions" ON tbl_transactions
  FOR ALL USING (user_id = auth.uid());

-- Grant access to authenticated role
GRANT ALL ON tbl_transactions TO authenticated;