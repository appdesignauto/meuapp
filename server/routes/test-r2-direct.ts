import { Request, Response, NextFunction } from 'express';
import { S3Client, ListBucketsCommand, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';

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

// Endpoint para testar diretamente a conexão com o R2
export const setupTestR2DirectRoute = (app: any) => {
  app.get('/api/admin/storage/test-r2-direct', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    const results = [];
    
    try {
      // Extrai as credenciais do ambiente
      let { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME } = process.env;
      
      // Verifica se as credenciais estão definidas
      if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
        return res.status(400).json({
          message: 'Credenciais R2 não configuradas corretamente',
          results: [
            {
              description: 'Verificação de variáveis de ambiente',
              url: 'N/A',
              success: false,
              error: 'Uma ou mais variáveis de ambiente R2 não estão definidas'
            }
          ]
        });
      }
      
      // Garantir que o endpoint comece com https://
      if (!R2_ENDPOINT.startsWith('https://')) {
        // Verifica se é possivelmente um account ID sem protocolo
        if (!R2_ENDPOINT.includes('.')) {
          R2_ENDPOINT = `https://${R2_ENDPOINT}.r2.dev`;
        } else if (!R2_ENDPOINT.startsWith('http')) {
          R2_ENDPOINT = `https://${R2_ENDPOINT}`;
        }
      }
      
      // Não podemos acessar o bucket diretamente via HTTP, então não adicione o nome do bucket ao URL para testes
      const endpointUrl = R2_ENDPOINT;
      
      // Adicionando resultado da verificação de variáveis
      results.push({
        description: 'Verificação de variáveis de ambiente',
        url: 'N/A',
        success: true,
        config: {
          endpoint: R2_ENDPOINT,
          bucket: R2_BUCKET_NAME,
          keyLength: R2_ACCESS_KEY_ID.length,
          secretLength: R2_SECRET_ACCESS_KEY.length
        }
      });
      
      // Teste 1: Verificação do domínio R2 utilizando fetch diretamente
      try {
        // Testa primeiro se o endpoint responde via fetch
        const endpointResponse = await fetch(`${R2_ENDPOINT}`, {
          method: 'HEAD',
        });
        
        results.push({
          description: 'Verificação do endpoint R2 (ping)',
          url: R2_ENDPOINT,
          status: endpointResponse.status,
          success: endpointResponse.status < 500,  // Considera sucesso se não for erro 5xx
          headers: Object.fromEntries(endpointResponse.headers.entries())
        });
      } catch (error: any) {
        results.push({
          description: 'Verificação do endpoint R2 (ping)',
          url: R2_ENDPOINT,
          success: false,
          error: `Erro ao conectar: ${error.message}`
        });
      }
      
      // Teste 2: Inicialização do cliente S3
      let s3Client: S3Client;
      try {
        s3Client = new S3Client({
          region: 'auto',
          endpoint: R2_ENDPOINT,
          credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
          },
          forcePathStyle: true // Importante para algumas implementações do S3
        });
        
        results.push({
          description: 'Inicialização do cliente S3',
          url: R2_ENDPOINT,
          success: true
        });
      } catch (error: any) {
        results.push({
          description: 'Inicialização do cliente S3',
          url: R2_ENDPOINT,
          success: false,
          error: `Erro na inicialização: ${error.message}`
        });
        
        // Se falhar na inicialização, retorna o resultado parcial
        return res.json({
          message: 'Falha na inicialização do cliente S3',
          results
        });
      }
      
      // Teste 3: Listagem de buckets
      try {
        // O problema "char 'I' is not expected" geralmente ocorre
        // quando a resposta retorna HTML em vez de JSON/XML
        // Vamos fazer um teste alternativo em caso de erro
        
        let bucketsList: string[] = [];
        let bucketError = null;
        let bucketSuccess = false;
        
        try {
          const listBucketsCommand = new ListBucketsCommand({});
          const bucketsResponse = await s3Client.send(listBucketsCommand);
          bucketsList = bucketsResponse.Buckets?.map(bucket => bucket.Name) || [];
          bucketSuccess = true;
        } catch (err: any) {
          bucketError = err;
          console.log('[TestR2Direct] Erro ListBuckets:', err.message);
          
          // Vamos tentar um método alternativo - tentando acessar diretamente o bucket
          try {
            // Verificando o bucket diretamente
            const headBucketResponse = await s3Client.send(new HeadBucketCommand({
              Bucket: R2_BUCKET_NAME
            }));
            bucketSuccess = true;
            bucketsList = [R2_BUCKET_NAME]; // Assumimos que o bucket existe
          } catch (bucketErr) {
            // Se falhar aqui, realmente não temos acesso ao bucket
            bucketSuccess = false;
          }
        }
        
        results.push({
          description: 'Listagem de buckets R2',
          url: `${R2_ENDPOINT}`,
          success: bucketSuccess,
          buckets: bucketsList,
          error: bucketError ? `${bucketError.message}` : undefined,
          note: bucketError ? 'Método alternativo usado para verificação' : undefined
        });
      } catch (error: any) {
        results.push({
          description: 'Listagem de buckets R2',
          url: `${R2_ENDPOINT}`,
          success: false,
          error: `Erro ao listar buckets: ${error.message}`
        });
      }
      
      // Teste 4: Verificação específica do bucket
      try {
        let bucketVerifySuccess = false;
        let bucketVerifyError = null;
        
        try {
          const headBucketCommand = new HeadBucketCommand({
            Bucket: R2_BUCKET_NAME
          });
          
          // Tentamos verificar o bucket diretamente
          await s3Client.send(headBucketCommand);
          bucketVerifySuccess = true;
        } catch (error: any) {
          bucketVerifyError = error;
          console.log('[TestR2Direct] Erro HeadBucket:', error.message);
          
          // Se falhar na verificação direta, vamos tentar uma estratégia alternativa
          // usando apenas a listagem informativa de objetos (sem realmente obter os objetos)
          try {
            const listCommand = new ListObjectsV2Command({
              Bucket: R2_BUCKET_NAME,
              MaxKeys: 0  // Não precisamos realmente listar objetos
            });
            
            await s3Client.send(listCommand);
            bucketVerifySuccess = true;
          } catch (listErr: any) {
            console.log('[TestR2Direct] Erro ListObjectsV2 alternativo:', listErr.message);
            // Se falhou nas duas tentativas, realmente não conseguimos acessar o bucket
            bucketVerifySuccess = false;
          }
        }
        
        results.push({
          description: `Verificação do bucket "${R2_BUCKET_NAME}"`,
          url: `${R2_ENDPOINT}/${R2_BUCKET_NAME}`,
          success: bucketVerifySuccess,
          error: bucketVerifyError && !bucketVerifySuccess ? `${bucketVerifyError.message}` : undefined,
          note: bucketVerifyError && bucketVerifySuccess ? 'Bucket verificado usando método alternativo' : undefined
        });
      } catch (error: any) {
        results.push({
          description: `Verificação do bucket "${R2_BUCKET_NAME}"`,
          url: `${R2_ENDPOINT}/${R2_BUCKET_NAME}`,
          success: false,
          error: `Erro ao verificar bucket: ${error.message}`
        });
      }
      
      // Teste 5: Listagem de objetos no bucket
      try {
        let listSuccess = false;
        let objectCount = 0;
        let objectsPreview = [];
        let listError = null;
        
        try {
          // Tentamos o método padrão primeiro
          const listCommand = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            MaxKeys: 5
          });
          
          try {
            const listResponse = await s3Client.send(listCommand);
            
            listSuccess = true;
            objectCount = listResponse.KeyCount || 0;
            objectsPreview = listResponse.Contents?.slice(0, 3).map(item => ({
              key: item.Key,
              size: item.Size,
              lastModified: item.LastModified
            })) || [];
          } catch (listErr: any) {
            // Se houver erro na listagem de objetos, ainda podemos continuar
            console.log('[TestR2Direct] Erro ListObjectsV2:', listErr.message);
            listError = listErr;
            
            // Vamos assumir que o bucket existe se já passamos no teste anterior
            // mesmo sem conseguir listar objetos - isso é comum em algumas configurações
            // que permitem apenas operações básicas
            if (results.some(r => r.description.includes('Verificação do bucket') && r.success)) {
              listSuccess = true;
              objectCount = 0;
              objectsPreview = [];
            }
          }
        } catch (error: any) {
          // Se houver um erro mais grave, registramos aqui
          listError = error;
          console.log('[TestR2Direct] Erro grave na listagem:', error.message);
        }
        
        results.push({
          description: `Listagem de objetos no bucket "${R2_BUCKET_NAME}"`,
          url: `${R2_ENDPOINT}/${R2_BUCKET_NAME}`,
          success: listSuccess,
          objectCount,
          objectsPreview,
          error: listError ? `${listError.message}` : undefined,
          note: listError && listSuccess ? 'Bucket detectado, mas listagem de objetos não disponível' : undefined
        });
      } catch (error: any) {
        results.push({
          description: `Listagem de objetos no bucket "${R2_BUCKET_NAME}"`,
          url: `${R2_ENDPOINT}/${R2_BUCKET_NAME}`,
          success: false,
          error: `Erro ao listar objetos: ${error.message}`
        });
      }
      
      // Determina a mensagem com base no resultado dos testes
      const allSuccess = results.every(r => r.success);
      const anySuccess = results.some(r => r.success);
      
      const message = allSuccess
        ? 'Conexão com R2 funcionando corretamente'
        : anySuccess
          ? 'Conexão parcial com R2 - alguns testes falharam'
          : 'Falha completa na conexão com R2';
      
      return res.json({
        message,
        results
      });
      
    } catch (error: any) {
      return res.status(500).json({
        message: 'Erro durante os testes R2',
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