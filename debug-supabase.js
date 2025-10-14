// Script de diagnóstico para testar conexões Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kwwhzysrvivbybaetpbb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3d2h6eXNydml2YnliYWV0cGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDkzNTksImV4cCI6MjA3NTk4NTM1OX0.ST4FU6VmY8_QxOSt9HilL3-GSIl8KOfZQF_SyANbr50'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...')
  
  try {
    // Teste 1: Verificar se o cliente foi criado corretamente
    console.log('✅ Cliente Supabase criado com sucesso')
    console.log('URL:', supabaseUrl)
    console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...')
    
    // Teste 2: Testar autenticação (verificar se consegue acessar dados públicos)
    console.log('\n🔐 Testando acesso aos dados...')
    
    // Teste 3: Verificar tabela bots
    console.log('\n📋 Testando acesso à tabela bots...')
    const { data: botsData, error: botsError } = await supabase
      .from('bots')
      .select('*')
      .limit(1)
    
    if (botsError) {
      console.error('❌ Erro ao acessar tabela bots:', botsError)
    } else {
      console.log('✅ Acesso à tabela bots OK')
      console.log('Dados retornados:', botsData)
    }
    
    // Teste 4: Verificar tabela subscriptions
    console.log('\n📋 Testando acesso à tabela subscriptions...')
    const { data: subsData, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
    
    if (subsError) {
      console.error('❌ Erro ao acessar tabela subscriptions:', subsError)
    } else {
      console.log('✅ Acesso à tabela subscriptions OK')
      console.log('Dados retornados:', subsData)
    }
    
    // Teste 5: Verificar tabela transactions
    console.log('\n📋 Testando acesso à tabela transactions...')
    const { data: transData, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1)
    
    if (transError) {
      console.error('❌ Erro ao acessar tabela transactions:', transError)
    } else {
      console.log('✅ Acesso à tabela transactions OK')
      console.log('Dados retornados:', transData)
    }
    
    // Teste 6: Verificar políticas RLS
    console.log('\n🔒 Testando políticas RLS...')
    
    // Tentar acessar com user_id específico
    const testUserId = 'd447d692-bc92-4f55-92dd-a4c2a14c63b5'
    const { data: userBotsData, error: userBotsError } = await supabase
      .from('bots')
      .select('*')
      .eq('user_id', testUserId)
    
    if (userBotsError) {
      console.error('❌ Erro ao filtrar por user_id:', userBotsError)
    } else {
      console.log('✅ Filtro por user_id OK')
      console.log('Bots do usuário:', userBotsData)
    }
    
    // Teste 7: Verificar sessão de usuário
    console.log('\n👤 Verificando sessão de usuário...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError)
    } else if (!user) {
      console.log('⚠️ Nenhum usuário autenticado')
    } else {
      console.log('✅ Usuário autenticado:', user.id)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar testes
testSupabaseConnection()