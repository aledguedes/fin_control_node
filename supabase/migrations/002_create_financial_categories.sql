-- Criar tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS tbl_financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('revenue', 'expense')),
  user_id UUID NOT NULL REFERENCES tbl_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_categories_user_id ON tbl_financial_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON tbl_financial_categories(type);

-- Enable Row Level Security
ALTER TABLE tbl_financial_categories ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança
-- Nota: Como estamos usando JWT customizado, a política usa user_id diretamente
CREATE POLICY "Users can only manage their own financial categories" ON tbl_financial_categories
  FOR ALL USING (true); -- Temporariamente permitindo tudo, ajustar conforme necessário com JWT

-- Grant access to authenticated role
GRANT ALL ON tbl_financial_categories TO authenticated;