import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://kwwhzysrvivbybaetpbb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3d2h6eXNydml2YnliYWV0cGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDkzNTksImV4cCI6MjA3NTk4NTM1OX0.ST4FU6VmY8_QxOSt9HilL3-GSIl8KOfZQF_SyANbr50';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarConexaoCompleta() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SUPABASE');
  console.log('=====================================');
  
  try {
    // 1. Testar conexão básica
    console.log('\n1. Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('plans')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro na conexão básica:', healthError.message);
      return;
    }
    console.log('✅ Conexão básica funcionando');

    // 2. Verificar status de autenticação
    console.log('\n2. Verificando autenticação...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError.message);
    } else if (!session) {
      console.log('⚠️  Usuário não autenticado - ESTA É A CAUSA DOS ERROS!');
      console.log('💡 Solução: Faça login no sistema primeiro');
      
      // Tentar login de teste
      console.log('\n3. Tentando login de teste...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (loginError) {
        console.log('⚠️  Login de teste falhou (esperado se usuário não existe):', loginError.message);
        console.log('💡 Crie uma conta primeiro ou use credenciais válidas');
      } else {
        console.log('✅ Login de teste bem-sucedido!');
      }
    } else {
      console.log('✅ Usuário autenticado:', session.user.email);
    }

    // 3. Testar acesso às tabelas (com e sem autenticação)
    console.log('\n4. Testando acesso às tabelas...');
    
    const tabelas = ['bots', 'plans', 'subscriptions', 'transactions', 'packages', 'custom_buttons', 'audit_logs'];
    
    for (const tabela of tabelas) {
      try {
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tabela}: ${error.message}`);
        } else {
          console.log(`✅ ${tabela}: Acesso OK (${data.length} registros)`);
        }
      } catch (err) {
        console.log(`❌ ${tabela}: Erro de conexão - ${err.message}`);
      }
    }

    // 4. Verificar políticas RLS
    console.log('\n5. Verificando políticas RLS...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies_info');
      
      if (policiesError) {
        console.log('⚠️  Não foi possível verificar políticas RLS:', policiesError.message);
      } else {
        console.log('✅ Políticas RLS verificadas');
      }
    } catch (err) {
      console.log('⚠️  Função get_policies_info não existe (normal)');
    }

    // 5. Resumo e soluções
    console.log('\n📋 RESUMO DO DIAGNÓSTICO');
    console.log('========================');
    
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      console.log('🔴 PROBLEMA IDENTIFICADO: Usuário não está logado');
      console.log('\n🔧 SOLUÇÕES:');
      console.log('1. Acesse http://localhost:5174/login');
      console.log('2. Crie uma conta ou faça login');
      console.log('3. Após o login, os erros net::ERR_ABORTED devem desaparecer');
      console.log('\n💡 Os erros acontecem porque as políticas RLS bloqueiam');
      console.log('   o acesso às tabelas para usuários não autenticados.');
    } else {
      console.log('🟢 Usuário está logado - investigar outros problemas');
    }

  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

// Executar diagnóstico
testarConexaoCompleta();