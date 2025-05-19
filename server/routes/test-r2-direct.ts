import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { supabaseStorageService } from '../services/supabase-storage';
import { createClient } from '@supabase/supabase-js';

// Middleware para verificar autenticação
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  next();
};

// Middleware para verificar permissões de admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  if (req.user.nivelacesso !== 'admin') {
    return res.status(403).json({ message: 'Acesso não autorizado' });
  }

  next();
};

// Endpoint para testar conexão com Supabase Storage
// Este endpoint substituiu a antiga rota do R2 Direct, mas manteve o nome por compatibilidade
export const setupTestR2DirectRoute = (app: any) => {
  app.get('/api/admin/storage/test-r2-direct', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    console.log('Endpoint legacy /api/admin/storage/test-r2-direct chamado, redirecionando para Supabase Storage');
    
    const results = [];
    
    try {
      // Verificar credenciais do Supabase
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
      
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(400).json({
          message: 'Credenciais do Supabase não configuradas corretamente',
          results: [
            {
              description: 'Verificação de variáveis de ambiente do Supabase',
              url: 'N/A',
              success: false,
              error: 'As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY precisam estar configuradas'
            }
          ]
        });
      }
      
      // Adicionando resultado da verificação de variáveis
      results.push({
        description: 'Verificação de variáveis de ambiente do Supabase',
        url: 'N/A',
        success: true,
        config: {
          supabaseUrl: SUPABASE_URL,
          keyConfigured: !!SUPABASE_ANON_KEY
        }
      });
      
      // Teste 1: Verificação do domínio Supabase utilizando fetch diretamente
      try {
        // Testa primeiro se o endpoint responde via fetch
        const endpointResponse = await fetch(`${SUPABASE_URL}`, {
          method: 'HEAD',
        });
        
        results.push({
          description: 'Verificação do endpoint Supabase (ping)',
          url: SUPABASE_URL,
          status: endpointResponse.status,
          success: endpointResponse.status < 500,  // Considera sucesso se não for erro 5xx
          headers: Object.fromEntries(endpointResponse.headers.entries())
        });
      } catch (error: any) {
        results.push({
          description: 'Verificação do endpoint Supabase (ping)',
          url: SUPABASE_URL,
          success: false,
          error: `Erro ao conectar: ${error.message}`
        });
      }
      
      // Teste 2: Inicialização do cliente Supabase
      let supabase;
      try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        results.push({
          description: 'Inicialização do cliente Supabase',
          url: SUPABASE_URL,
          success: true
        });
      } catch (error: any) {
        results.push({
          description: 'Inicialização do cliente Supabase',
          url: SUPABASE_URL,
          success: false,
          error: `Erro na inicialização: ${error.message}`
        });
        
        // Se falhar na inicialização, retorna o resultado parcial
        return res.json({
          message: 'Falha na inicialização do cliente Supabase',
          results
        });
      }
      
      // Teste 3: Listagem de buckets
      try {
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        const bucketsList = buckets?.map(bucket => bucket.name) || [];
        
        results.push({
          description: 'Listagem de buckets Supabase',
          url: `${SUPABASE_URL}/storage/buckets`,
          success: !bucketsError,
          buckets: bucketsList,
          error: bucketsError ? bucketsError.message : undefined
        });
      } catch (error: any) {
        results.push({
          description: 'Listagem de buckets Supabase',
          url: `${SUPABASE_URL}/storage/buckets`,
          success: false,
          error: `Erro ao listar buckets: ${error.message}`
        });
      }
      
      // Teste 4: Verificação do bucket designautoimages
      try {
        const { data, error } = await supabase
          .storage
          .from('designautoimages')
          .list('', {
            limit: 1
          });
        
        results.push({
          description: `Verificação do bucket "designautoimages"`,
          url: `${SUPABASE_URL}/storage/buckets/designautoimages`,
          success: !error,
          error: error ? error.message : undefined
        });
      } catch (error: any) {
        results.push({
          description: `Verificação do bucket "designautoimages"`,
          url: `${SUPABASE_URL}/storage/buckets/designautoimages`,
          success: false,
          error: `Erro ao verificar bucket: ${error.message}`
        });
      }
      
      // Teste 5: Listagem de objetos no bucket
      try {
        const { data, error } = await supabase
          .storage
          .from('designautoimages')
          .list('', {
            limit: 5
          });
        
        const objectsCount = data?.length || 0;
        const objectsPreview = data?.slice(0, 3).map(item => ({
          name: item.name,
          size: item.metadata?.size,
          created: item.created_at
        })) || [];
        
        results.push({
          description: `Listagem de objetos no bucket "designautoimages"`,
          url: `${SUPABASE_URL}/storage/buckets/designautoimages/objects`,
          success: !error,
          objectCount: objectsCount,
          objectsPreview,
          error: error ? error.message : undefined
        });
      } catch (error: any) {
        results.push({
          description: `Listagem de objetos no bucket "designautoimages"`,
          url: `${SUPABASE_URL}/storage/buckets/designautoimages/objects`,
          success: false,
          error: `Erro ao listar objetos: ${error.message}`
        });
      }
      
      // Determina a mensagem com base no resultado dos testes
      const allSuccess = results.every(r => r.success);
      const anySuccess = results.some(r => r.success);
      
      const message = allSuccess
        ? 'Conexão com Supabase Storage funcionando corretamente'
        : anySuccess
          ? 'Conexão parcial com Supabase Storage - alguns testes falharam'
          : 'Falha completa na conexão com Supabase Storage';
      
      return res.json({
        message,
        results
      });
      
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro durante os testes Supabase',
        results: [
          ...results,
          {
            description: 'Erro geral',
            url: 'N/A',
            success: false,
            error: error.message
          }
        ]
      });
    }
  });
};