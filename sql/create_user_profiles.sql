-- Criar tabela para armazenar perfis de usuários adicionais
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  permissions JSONB NOT NULL DEFAULT '{
    "createSurveys": false,
    "editSurveys": false,
    "deleteSurveys": false,
    "viewResponses": false,
    "exportData": false,
    "manageUsers": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON public.user_profiles(role);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política RLS - usuários podem ver apenas seus próprios perfis, exceto admins
CREATE POLICY "Usuários podem ver seus próprios perfis" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Política RLS - apenas admins podem inserir novos perfis
CREATE POLICY "Admins podem inserir perfis" ON public.user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Política RLS - usuários podem atualizar seus próprios perfis, admins podem atualizar qualquer perfil
CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.user_profiles
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Política RLS - apenas super_admins podem deletar perfis
CREATE POLICY "Super admins podem deletar perfis" ON public.user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir perfil do primeiro super admin (ajuste o email conforme necessário)
-- IMPORTANTE: Execute este comando após criar o primeiro usuário admin no Supabase Auth
-- INSERT INTO public.user_profiles (user_id, name, role, permissions)
-- SELECT 
--   id,
--   COALESCE(raw_user_meta_data->>'name', email),
--   'super_admin',
--   '{
--     "createSurveys": true,
--     "editSurveys": true,
--     "deleteSurveys": true,
--     "viewResponses": true,
--     "exportData": true,
--     "manageUsers": true
--   }'::jsonb
-- FROM auth.users 
-- WHERE email = 'seu-email@exemplo.com'  -- Substitua pelo seu email
-- AND NOT EXISTS (
--   SELECT 1 FROM public.user_profiles WHERE user_id = auth.users.id
-- ); 