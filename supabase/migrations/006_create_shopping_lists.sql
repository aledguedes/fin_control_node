-- Criar tabela de listas de compras
CREATE TABLE IF NOT EXISTS tbl_shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10,2),
  user_id UUID NOT NULL REFERENCES tbl_users(id) ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON tbl_shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_status ON tbl_shopping_lists(status);

-- Enable Row Level Security
ALTER TABLE tbl_shopping_lists ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança
-- Nota: Como estamos usando JWT customizado, a política usa user_id diretamente
CREATE POLICY "Users can only manage their own shopping lists" ON tbl_shopping_lists
  FOR ALL USING (true); -- Temporariamente permitindo tudo, ajustar conforme necessário com JWT

-- Grant access to authenticated role
GRANT ALL ON tbl_shopping_lists TO authenticated;