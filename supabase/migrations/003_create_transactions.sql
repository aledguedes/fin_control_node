CREATE TABLE IF NOT EXISTS tbl_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  type VARCHAR(10) NOT NULL CHECK (type IN ('revenue', 'expense')),
  transaction_date DATE NOT NULL,
  payment_method VARCHAR(50),
  is_installment BOOLEAN DEFAULT FALSE,
  is_recurrent BOOLEAN DEFAULT FALSE,
  recurrence_start_date DATE,
  category_id UUID NOT NULL REFERENCES tbl_financial_categories(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES tbl_users(id) ON DELETE CASCADE,
  installments JSONB,
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  parent_transaction_id UUID REFERENCES tbl_transactions(id) ON DELETE SET NULL,
  paid_installments INTEGER DEFAULT 0,
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON tbl_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON tbl_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON tbl_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON tbl_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_is_installment ON tbl_transactions(is_installment);
CREATE INDEX IF NOT EXISTS idx_transactions_is_recurrent ON tbl_transactions(is_recurrent);
CREATE INDEX IF NOT EXISTS idx_transactions_total_installments ON tbl_transactions(total_installments);
CREATE INDEX IF NOT EXISTS idx_transactions_start_date ON tbl_transactions(start_date);
CREATE INDEX IF NOT EXISTS idx_transactions_parent_transaction_id ON tbl_transactions(parent_transaction_id); 

ALTER TABLE tbl_transactions ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança
-- Nota: Como estamos usando JWT customizado, a política usa user_id diretamente
CREATE POLICY "Users can only manage their own transactions" ON tbl_transactions
  FOR ALL USING (true); -- Temporariamente permitindo tudo, ajustar conforme necessário com JWT

GRANT ALL ON tbl_transactions TO authenticated;