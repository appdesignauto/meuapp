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