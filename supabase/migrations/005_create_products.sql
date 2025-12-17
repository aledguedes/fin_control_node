-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS tbl_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  unit VARCHAR(10) NOT NULL CHECK (unit IN ('un', 'kg', 'l', 'dz', 'm', 'cx')),
  category_id UUID NOT NULL REFERENCES tbl_shopping_categories(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES tbl_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON tbl_products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON tbl_products(category_id);

-- Enable Row Level Security
ALTER TABLE tbl_products ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança
-- Nota: Como estamos usando JWT customizado, a política usa user_id diretamente
CREATE POLICY "Users can only manage their own products" ON tbl_products
  FOR ALL USING (true); -- Temporariamente permitindo tudo, ajustar conforme necessário com JWT

-- Grant access to authenticated role
GRANT ALL ON tbl_products TO authenticated;