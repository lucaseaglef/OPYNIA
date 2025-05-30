# 📋 Configuração do Sistema de Usuários - OPYNIA

## 🚀 Funcionalidades Implementadas

✅ **Criação de usuários** via interface administrativa  
✅ **Edição de perfis** com diferentes níveis de permissão  
✅ **Exclusão de usuários** (apenas para super admins)  
✅ **Sistema de roles** (Super Admin, Admin, Editor, Visualizador)  
✅ **Permissões granulares** por funcionalidade  
✅ **Status ativo/inativo** para usuários  
✅ **Integração completa com Supabase Auth**  

## ⚙️ Configuração Necessária

### 1. Variáveis de Ambiente

Certifique-se de que seu `.env.local` contenha:

```bash
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# Neon Database (para pesquisas)
DATABASE_URL=sua_string_de_conexao_neon
```

### 2. Executar SQL no Supabase

1. Acesse o painel do Supabase
2. Vá em `SQL Editor`
3. Execute o conteúdo do arquivo `sql/create_user_profiles.sql`

### 3. Criar Primeiro Super Admin

Após executar o SQL, descomente e ajuste o comando final do arquivo SQL:

```sql
INSERT INTO public.user_profiles (user_id, name, role, permissions)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  'super_admin',
  '{
    "createSurveys": true,
    "editSurveys": true,
    "deleteSurveys": true,
    "viewResponses": true,
    "exportData": true,
    "manageUsers": true
  }'::jsonb
FROM auth.users 
WHERE email = 'seu-email@exemplo.com'  
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE user_id = auth.users.id
);
```

## 🎯 Como Usar

### Acessar Gerenciamento de Usuários

1. Faça login na aplicação
2. Vá em **Configurações** (ícone de engrenagem)
3. Clique na aba **Usuários**

### Criar Novo Usuário

1. Clique em **"Novo Usuário"**
2. Preencha os dados:
   - **Nome completo**
   - **Email** (será usado para login)
   - **Senha** (mínimo 6 caracteres)
   - **Função** (role)
   - **Permissões** (ajustadas automaticamente pela função)
   - **Status** (ativo/inativo)

### Tipos de Usuário

| Função | Descrição | Permissões |
|--------|-----------|------------|
| **Super Admin** | Controle total | Todas as permissões |
| **Admin** | Administrador | Tudo exceto gerenciar usuários |
| **Editor** | Editor de conteúdo | Criar/editar pesquisas, ver respostas |
| **Visualizador** | Apenas leitura | Apenas ver respostas |

### Editar Usuário

1. Clique no ícone de **editar** (lápis) ao lado do usuário
2. Modifique os dados necessários
3. Clique em **"Atualizar Usuário"**

### Excluir Usuário

1. Clique no ícone de **lixeira** ao lado do usuário
2. Confirme a exclusão

⚠️ **Atenção**: Apenas Super Admins podem excluir usuários

## 🔐 Segurança

- **Row Level Security (RLS)** habilitado
- **Políticas de acesso** por função
- **Senhas criptografadas** pelo Supabase Auth
- **Validação de permissões** no backend

## 🛠️ Arquivos Modificados/Criados

### Backend (APIs)
- `app/api/users/route.ts` - CRUD de usuários
- `app/api/users/[id]/route.ts` - Operações por ID

### Frontend
- `app/settings/page.tsx` - Interface atualizada

### Database
- `sql/create_user_profiles.sql` - Estrutura da tabela

### Configuração
- `SETUP_USUARIOS.md` - Este arquivo

## 🐛 Resolução de Problemas

### Erro: "Missing Supabase environment variables"
- Verifique se as variáveis de ambiente estão configuradas
- Reinicie o servidor de desenvolvimento

### Erro: "Table 'user_profiles' doesn't exist"
- Execute o SQL `create_user_profiles.sql` no Supabase

### Erro: "Permission denied"
- Verifique se o usuário atual tem permissões de admin
- Execute o comando para criar o primeiro super admin

### Usuários não aparecem na lista
- Verifique os logs do console do navegador
- Confirme se a API `/api/users` está funcionando

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do console (F12)
2. Confirme as variáveis de ambiente
3. Teste as APIs diretamente em `/api/users`

---

✨ **Sistema de usuários implementado com sucesso!** 

Agora você pode gerenciar usuários diretamente pela interface administrativa. 