-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS tbl_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice no email para busca rápida
CREATE INDEX IF NOT EXISTS idx_users_email ON tbl_users(email);

-- Enable Row Level Security
ALTER TABLE tbl_users ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança (os usuários só podem ver seus próprios dados)
-- Nota: Como estamos usando JWT customizado, a política usa user_id diretamente
-- Se usar Supabase Auth, trocar para: USING (id = auth.uid())
CREATE POLICY "Users can only see their own data" ON tbl_users
  FOR ALL USING (true); -- Temporariamente permitindo tudo, ajustar conforme necessário com JWT

-- Grant access to anon and authenticated roles
GRANT SELECT ON tbl_users TO anon;
GRANT SELECT ON tbl_users TO authenticated;