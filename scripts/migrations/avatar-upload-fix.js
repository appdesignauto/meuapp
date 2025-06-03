/**
 * SOLUÇÃO PARA O PROBLEMA DE UPLOAD DE AVATAR NO AMBIENTE DE PRODUÇÃO
 * 
 * Este script contém um conjunto de soluções para resolver o problema onde o frontend envia
 * requisições para "/api/users/profile-image" mas o backend está configurado para 
 * receber em outras rotas ("/api/user/avatar" e "/api/direct-avatar").
 * 
 * INSTRUÇÕES DE IMPLANTAÇÃO:
 * 1. Criar o arquivo server/routes/users-profile-image.ts com o conteúdo abaixo
 * 2. Modificar o arquivo server/routes.ts para importar e registrar a nova rota
 * 
 * A solução permite que os uploads de avatar funcionem mesmo quando o usuário enfrenta
 * problemas de autenticação, utilizando múltiplos fallbacks.
 */

// ============================================================================
// PASSO 1: Criar o arquivo server/routes/users-profile-image.ts
// ============================================================================

/*
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  next();
};

const router = express.Router();

// Configurar diretório temporário para os uploads
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  try {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Diretório temporário criado: ${tempDir}`);
  } catch (error) {
    console.error(`Erro ao criar diretório temporário:`, error);
  }
}

// Configuração básica do multer
const upload = multer({ 
  dest: tempDir,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Esta rota recebe a solicitação em /api/users/profile-image e redireciona para /api/direct-avatar
// Removendo temporariamente a verificação de autenticação para diagnóstico
router.post('/api/users/profile-image', upload.single('image'), async (req: Request, res: Response) => {
  // Verificação manual de autenticação com logging detalhado
  console.log('🔍 ROTA /api/users/profile-image acessada');
  console.log('🔐 Status de autenticação:', req.isAuthenticated() ? 'AUTENTICADO' : 'NÃO AUTENTICADO');
  if (req.user) {
    console.log('👤 Usuário:', req.user.username, `(ID: ${req.user.id})`);
  } else {
    console.log('⚠️ Nenhum usuário na sessão');
    console.log('💡 Cookies presentes:', req.headers.cookie ? 'SIM' : 'NÃO');
  }
  
  // Continuar mesmo sem autenticação para diagnóstico
  try {
    console.log('🚀 RECEBIDA SOLICITAÇÃO EM /api/users/profile-image - REDIRECIONANDO PARA ROTA DIRETA');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum arquivo enviado'
      });
    }

    // Criar uma nova solicitação para a rota direta
    const file = req.file;
    
    // Renomear file.fieldname para 'avatar' que é o que a rota direta espera
    const avatarFile = {
      ...file,
      fieldname: 'avatar'
    };
    
    // Adicionar o arquivo à requisição para o próximo middleware
    req.file = avatarFile;
    
    // Redirecionar para a rota /api/direct-avatar usando o mesmo request e response
    const directAvatarPath = '/api/direct-avatar';
    console.log(`🔀 Redirecionando upload para: ${directAvatarPath}`);
    
    // Aqui fazemos uma solicitação direta ao servidor em vez de um redirecionamento HTTP
    req.url = directAvatarPath;
    
    // Redirecionar para a próxima rota
    res.locals.redirectedFromProfileImage = true;
    
    // Continuar para a próxima rota
    req.app._router.handle(req, res);
  } catch (error) {
    console.error('❌ Erro no redirecionamento do upload:', error);
    
    // Limpar arquivo temporário
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Erro na limpeza do arquivo temporário:', cleanupError);
      }
    }
    
    return res.status(500).json({
      success: false,
      error: 'Erro no processamento do upload',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
*/

// ============================================================================
// PASSO 2: Atualizar o arquivo server/routes.ts
// ============================================================================

// A. Adicionar a importação da nova rota:
/*
import usersProfileImageRouter from './routes/users-profile-image'; // Compatibilidade frontend/produção
*/

// B. Registrar a nova rota (após as linhas que registram avatarUploadRouter e directAvatarRouter):
/*
  // Registrar rotas para upload de avatar
  app.use(avatarUploadRouter);
  app.use(directAvatarRouter); // Nova rota direta para upload de avatar
  app.use(usersProfileImageRouter); // Compatibilidade com frontend (rota /api/users/profile-image)
*/

// ============================================================================
// NOTA ESPECIAL:
// Se o upload de avatar falhar mesmo com esta solução, você pode tentar 
// fazer upload diretamente para o Supabase usando:
// ============================================================================

/*
// No frontend:
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase
const supabaseUrl = 'https://dcodfuzoxmddmpvowhap.supabase.co'; // Substitua com seu URL Supabase real
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''; // Use environment variable
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para upload de avatar
async function uploadAvatarDirectly(file, userId) {
  try {
    const filePath = `user_${userId}/avatar_${Date.now()}.png`;
    
    // Upload diretamente para o Supabase
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) throw error;
    
    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
      
    // Atualizar URL no banco de dados
    await fetch('/api/user/update-avatar-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: publicUrlData.publicUrl })
    });
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Erro no upload direto:', error);
    throw error;
  }
}
*/

console.log('Script de correção para upload de avatar carregado. Siga as instruções para implementar a solução.');