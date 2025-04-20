import { Router, Request, Response, NextFunction } from 'express';

// Middleware de autenticação
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
};

// Middleware de admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user?.nivelacesso === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Acesso negado" });
};

// Credenciais fixas do R2 para teste direto
const R2_ACCESS_KEY_ID = '21be81ed3af893e3ba85c2';
const R2_SECRET_ACCESS_KEY = 'c3e7cc28a2ffb45471cc57a2842735b5e524a7a0d2c5ff5a4cedb8145dbd1b4d';
const R2_ENDPOINT = '32b65e21b65af0345c36f5c43fa32c54';
const R2_BUCKET_NAME = 'designautoimages';

const router = Router();

// Rota de diagnóstico para testar conexão R2 diretamente sem o SDK
router.get('/api/admin/r2-test-direct', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log(`[R2-TEST-DIRECT] Iniciando teste direto de conexão R2`);
    
    const testData = [
      {
        description: "Teste com formato .r2.dev",
        endpoint: `https://${R2_ENDPOINT}.r2.dev`,
        bucket: R2_BUCKET_NAME,
        key: R2_ACCESS_KEY_ID,
        secret: R2_SECRET_ACCESS_KEY
      },
      {
        description: "Teste com formato .r2.cloudflarestorage.com",
        endpoint: `https://${R2_ENDPOINT}.r2.cloudflarestorage.com`,
        bucket: R2_BUCKET_NAME,
        key: R2_ACCESS_KEY_ID,
        secret: R2_SECRET_ACCESS_KEY
      },
      {
        description: "Teste sem HTTPS",
        endpoint: `${R2_ENDPOINT}.r2.dev`,
        bucket: R2_BUCKET_NAME,
        key: R2_ACCESS_KEY_ID,
        secret: R2_SECRET_ACCESS_KEY
      }
    ];
    
    // Dados para o teste
    const results = await Promise.allSettled(
      testData.map(async (test) => {
        try {
          const url = `${test.endpoint}/${test.bucket}`;
          
          // Criar cabeçalhos para autenticação AWS
          const date = new Date().toUTCString();
          const awsAuth = `AWS4-HMAC-SHA256 Credential=${test.key}/${date}/auto/s3/aws4_request`;
          
          // Chamar API diretamente com fetch 
          const result = await fetch(url, {
            method: 'HEAD',
            headers: {
              'Host': `${test.endpoint}`,
              'Date': date,
              'Authorization': awsAuth,
              'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD'
            }
          });
          
          const status = result.status;
          const headers = Object.fromEntries(result.headers.entries());
          
          return {
            description: test.description,
            url,
            status,
            success: status >= 200 && status < 300,
            headers
          };
        } catch (error) {
          return {
            description: test.description,
            url: `${test.endpoint}/${test.bucket}`,
            error: error instanceof Error ? error.message : String(error),
            success: false
          };
        }
      })
    );
    
    // Resultados completos
    const detailedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          ...result.value,
          config: {
            ...testData[index],
            secret: `${testData[index].secret.substring(0, 5)}...`
          }
        };
      } else {
        return {
          description: testData[index].description,
          config: {
            ...testData[index],
            secret: `${testData[index].secret.substring(0, 5)}...`
          },
          error: result.reason,
          success: false
        };
      }
    });
    
    res.json({
      message: "Teste direto de conexão R2 completo",
      results: detailedResults
    });
  } catch (error) {
    console.error("[R2-TEST-DIRECT] Erro:", error);
    res.status(500).json({ 
      message: "Erro ao testar conexão direta com R2",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;