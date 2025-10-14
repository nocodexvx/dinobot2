# 🚨 GUIA PASSO A PASSO: Como Aplicar as Migrações

## ❌ ERROS QUE VOCÊ ESTÁ VENDO:

```
❌ Failed to load resource: 404 (packages)
❌ Failed to load resource: 400 (plans)
❌ Erro ao salvar plano
❌ Erro ao carregar dados do bot
```

## ✅ SOLUÇÃO: Aplicar as Migrações no Supabase

Siga EXATAMENTE estes passos:

---

## 📋 PASSO 1: Abrir o Supabase Dashboard

1. Abra seu navegador
2. Acesse: **https://supabase.com/dashboard**
3. Faça login na sua conta
4. Selecione o projeto **ApexVips** (ou o nome do seu projeto)

---

## 📋 PASSO 2: Abrir o SQL Editor

1. No menu lateral esquerdo, procure por **SQL Editor**
2. Clique em **SQL Editor**
3. Você verá uma tela com um editor de código SQL

---

## 📋 PASSO 3: Copiar o SQL Completo

1. Abra o arquivo `APPLY_MIGRATIONS.md` deste projeto
2. Role até a seção que diz:
   ```
   ### Passo 2: Executar TODAS as Migrações

   Copie e cole o SQL completo abaixo...
   ```
3. **COPIE TODO O CÓDIGO SQL** (desde `-- ====` até o final do bloco SQL)

---

## 📋 PASSO 4: Colar e Executar no Supabase

1. **Cole** todo o código SQL que você copiou no SQL Editor do Supabase
2. Verifique se todo o código foi colado corretamente
3. Clique no botão **RUN** (ou **Executar**)
4. Aguarde a execução (pode demorar alguns segundos)

---

## 📋 PASSO 5: Verificar se Funcionou

Após executar o SQL, verifique:

### 5.1 - Verificar Tabelas Criadas

1. No menu lateral, clique em **Table Editor**
2. Você DEVE ver estas tabelas na lista:
   - ✅ `bots`
   - ✅ `plans`
   - ✅ `packages` ← **NOVA**
   - ✅ `custom_buttons` ← **NOVA**
   - ✅ `subscriptions`
   - ✅ `transactions`

### 5.2 - Verificar Campos Novos em Plans

1. No Table Editor, clique na tabela **`plans`**
2. Verifique se existem estas colunas:
   - ✅ `id`
   - ✅ `bot_id`
   - ✅ `name`
   - ✅ `description`
   - ✅ `price`
   - ✅ `duration_type`
   - ✅ `duration_days`
   - ✅ `deliverables` ← **NOVO**
   - ✅ `order_bump_text` ← **NOVO**
   - ✅ `order_bump_accept_text` ← **NOVO**
   - ✅ `order_bump_reject_text` ← **NOVO**
   - ✅ `order_bump_value` ← **NOVO**
   - ✅ `order_bump_media_url` ← **NOVO**
   - ✅ `order_bump_audio_url` ← **NOVO**

---

## 📋 PASSO 6: Recarregar o App

1. Volte para o app no navegador
2. Pressione **F5** ou **Ctrl+R** (Windows) / **Cmd+R** (Mac)
3. Tente criar um plano novamente

---

## ✅ RESULTADO ESPERADO

Após aplicar as migrações, você DEVE conseguir:

- ✅ Criar planos de assinatura SEM erros
- ✅ Criar pacotes (compra única)
- ✅ Adicionar botões personalizados
- ✅ Ver previews em tempo real
- ✅ Configurar PIX e QR Codes

---

## 🆘 AINDA COM PROBLEMAS?

### Erro: "relation already exists"
- **Solução**: Ignore esse erro, significa que a tabela já foi criada

### Erro: "permission denied"
- **Solução**: Verifique se você está logado com a conta correta no Supabase

### Erro: "syntax error"
- **Solução**: Certifique-se de copiar TODO o código SQL, incluindo as linhas `DO $$` e `END $$`

### Ainda não funciona?
1. Tire um print da tela de erro
2. Tire um print do SQL Editor mostrando o código
3. Tire um print do Table Editor mostrando as tabelas
4. Entre em contato com o suporte

---

## 📝 RESUMO

```
1. Supabase Dashboard → SQL Editor
2. Copiar SQL do arquivo APPLY_MIGRATIONS.md
3. Colar no SQL Editor
4. Clicar em RUN
5. Verificar no Table Editor
6. Recarregar o app (F5)
```

---

## ⚠️ IMPORTANTE

**NÃO PULE NENHUM PASSO!**

Todas as etapas são necessárias para o sistema funcionar corretamente.
