import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Credenciais do Supabase não configuradas!');
  console.error('Por favor, configure SUPABASE_URL e SUPABASE_ANON_KEY nas variáveis de ambiente.');
}

// Criar cliente do Supabase
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      persistSession: false // Desabilitar persistência já que usamos Passport
    }
  }
);

// Nomes dos buckets
export const BUCKET_NAME = 'images';
export const AVATARS_BUCKET = 'avatars';

// Função para verificar conexão com Supabase
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }

    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    console.log(`Buckets disponíveis: ${data.map(b => b.name).join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error);
    return false;
  }
} 