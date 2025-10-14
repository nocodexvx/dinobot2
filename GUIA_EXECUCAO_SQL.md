# 🗄️ GUIA: Como Executar o Script SQL no Supabase

## 📋 Pré-requisitos
✅ Credenciais do Supabase já configuradas no `.env.local`  
✅ Projeto DINOBOT criado no Supabase Dashboard  
✅ Acesso ao Supabase Dashboard  

## 🚀 Passo a Passo para Executar o SQL

### 1️⃣ **Acesse o Supabase Dashboard**
1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **kwwhzysrvivbybaetpbb**

### 2️⃣ **Abra o SQL Editor**
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"** para criar uma nova consulta

### 3️⃣ **Execute o Script do Banco de Dados**
1. Abra o arquivo: `DINOBOT_DATABASE_OPTIMIZED.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** (ou pressione Ctrl+Enter)

### 4️⃣ **Verificar se Funcionou**
Após executar, você deve ver:
- ✅ **"Success. No rows returned"** (isso é normal!)
- ✅ **7 tabelas criadas** no menu "Table Editor"
- ✅ **Políticas RLS ativas** em todas as tabelas

### 5️⃣ **Verificar as Tabelas Criadas**
No menu **"Table Editor"**, você deve ver:
1. 🤖 **bots** - Configuração dos bots
2. 📋 **plans** - Planos de assinatura
3. 📦 **packages** - Pacotes de compra única
4. 🔘 **custom_buttons** - Botões personalizados
5. 👥 **subscriptions** - Assinaturas dos usuários
6. 💳 **transactions** - Histórico de pagamentos
7. 📝 **audit_logs** - Logs de auditoria

## 🔧 Solução de Problemas

### ❌ **Erro: "permission denied"**
**Solução:** Verifique se você está logado com a conta correta no Supabase

### ❌ **Erro: "relation already exists"**
**Solução:** As tabelas já existem. Você pode:
1. Deletar as tabelas existentes primeiro, OU
2. Pular este passo se as tabelas já estão criadas

### ❌ **Erro: "syntax error"**
**Solução:** 
1. Certifique-se de copiar TODO o conteúdo do arquivo
2. Não edite o SQL manualmente
3. Execute o arquivo completo de uma vez

## ✅ **Confirmação Final**

Após executar o SQL com sucesso:

1. **Teste a aplicação**: http://localhost:5174/
2. **Faça login** na aplicação
3. **Crie um bot** para testar
4. **Verifique se não há erros** no console

## 🎯 **Próximos Passos**

Após executar o SQL:
1. ✅ Banco de dados criado
2. ✅ Aplicação conectada
3. ✅ Sistema pronto para uso
4. 🚀 **Comece a criar seus bots!**

---

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique se todas as credenciais estão corretas no `.env.local`
2. Confirme se o projeto Supabase está ativo
3. Teste a conexão com a aplicação

**🎉 Seu sistema DINOBOT estará 100% funcional após estes passos!**