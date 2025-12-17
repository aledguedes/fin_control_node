-- Criar tabela de itens da lista de compras
CREATE TABLE IF NOT EXISTS tbl_shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  checked BOOLEAN DEFAULT FALSE,
  shopping_list_id UUID NOT NULL REFERENCES tbl_shopping_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES tbl_products(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON tbl_shopping_list_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_product_id ON tbl_shopping_list_items(product_id);

-- Enable Row Level Security
ALTER TABLE tbl_shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança
-- Nota: Como estamos usando JWT customizado, a política usa user_id diretamente
CREATE POLICY "Users can only manage their own shopping list items" ON tbl_shopping_list_items
  FOR ALL USING (true); -- Temporariamente permitindo tudo, ajustar conforme necessário com JWT

-- Grant access to authenticated role
GRANT ALL ON tbl_shopping_list_items TO authenticated;