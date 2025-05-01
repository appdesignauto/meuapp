import { createClient } from '@supabase/supabase-js';

// Verificação de variáveis de ambiente
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('Aviso: Credenciais do Supabase não encontradas. Funcionalidade de armazenamento pode estar limitada.');
}

// Inicialização do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

class SupabaseStorageService {
  private initialized: boolean = false;
  private logs: string[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (supabaseUrl && supabaseAnonKey) {
        this.initialized = true;
        this.log('✅ Serviço Supabase Storage inicializado com sucesso');
      } else {
        this.log('⚠️ Inicialização do Supabase Storage falhou: credenciais ausentes');
      }
    } catch (error) {
      this.log(`❌ Erro na inicialização do Supabase Storage: ${error}`);
    }
  }

  private log(message: string) {
    this.logs.push(`[SupabaseStorage ${new Date().toISOString()}] ${message}`);
    console.log(message);
  }

  // Upload de arquivo para o Supabase Storage
  async uploadFile(
    bucketName: string,
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.initialized) {
      return { 
        success: false, 
        error: 'Supabase Storage não está inicializado' 
      };
    }

    try {
      this.log(`Iniciando upload para bucket '${bucketName}', caminho: ${filePath}`);

      // Tentar fazer upload do arquivo
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: true
        });

      if (error) {
        this.log(`❌ Erro no upload: ${error.message}`);
        return { 
          success: false, 
          error: error.message 
        };
      }

      // Obter URL pública do arquivo
      const { data: publicUrlData } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(data.path);

      this.log(`✅ Upload concluído com sucesso. URL: ${publicUrlData.publicUrl}`);
      
      return {
        success: true,
        url: publicUrlData.publicUrl
      };
    } catch (error) {
      const errorMessage = `Erro no upload para Supabase: ${error}`;
      this.log(`❌ ${errorMessage}`);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  // Listar arquivos em um bucket
  async getBucket(bucketName: string) {
    if (!this.initialized) {
      return { success: false, error: 'Supabase Storage não está inicializado' };
    }

    try {
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .list();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: `Erro ao listar bucket: ${error}` };
    }
  }

  // Verificar conexão/status
  async checkStatus() {
    if (!this.initialized) {
      return { 
        success: false, 
        status: 'not_initialized',
        error: 'Supabase Storage não está inicializado' 
      };
    }

    try {
      // Tentativa de verificar buckets
      const { data, error } = await supabase
        .storage
        .listBuckets();

      if (error) {
        return { 
          success: false, 
          status: 'error',
          error: error.message 
        };
      }

      return { 
        success: true, 
        status: 'connected',
        buckets: data.map(b => b.name)
      };
    } catch (error) {
      return { 
        success: false, 
        status: 'error',
        error: `Erro ao verificar status: ${error}` 
      };
    }
  }

  // Obter logs do serviço
  getLogs() {
    return this.logs;
  }
}

export const supabaseStorageService = new SupabaseStorageService();