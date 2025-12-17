-- Criar tabela de categorias de compras
CREATE TABLE IF NOT EXISTS tbl_shopping_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES tbl_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_shopping_categories_user_id ON tbl_shopping_categories(user_id);

-- Enable Row Level Security
ALTER TABLE tbl_shopping_categories ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança
-- Nota: Como estamos usando JWT customizado, a política usa user_id diretamente
CREATE POLICY "Users can only manage their own shopping categories" ON tbl_shopping_categories
  FOR ALL USING (true); -- Temporariamente permitindo tudo, ajustar conforme necessário com JWT

-- Grant access to authenticated role
GRANT ALL ON tbl_shopping_categories TO authenticated;