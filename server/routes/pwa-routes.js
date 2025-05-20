import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db.js";
import { appConfig } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import sharp from "sharp";

const router = Router();
const upload = multer({ dest: "temp/" });

// Diretório para armazenar os ícones
const ICONS_DIR = path.join(process.cwd(), "public", "icons");

// Certifica-se de que o diretório exista
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Rota para obter as configurações do PWA
router.get("/api/app-config", async (req, res) => {
  try {
    const configs = await db.select().from(appConfig);
    const config = configs.length > 0 ? configs[0] : null;
    
    if (!config) {
      return res.status(404).json({ message: "Configurações não encontradas" });
    }
    
    res.json(config);
  } catch (error) {
    console.error("Erro ao buscar configurações do PWA:", error);
    res.status(500).json({ message: "Erro ao buscar configurações do PWA" });
  }
});

// Rota para atualizar as configurações do PWA
router.put("/api/app-config", async (req, res) => {
  if (!req.isAuthenticated() || req.user.nivelAcesso !== "admin") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }
  
  try {
    const { name, shortName, themeColor, backgroundColor } = req.body;
    
    // Valida campos obrigatórios
    if (!name || !shortName || !themeColor || !backgroundColor) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }
    
    const configs = await db.select().from(appConfig);
    
    if (configs.length === 0) {
      // Se não existir configuração, cria uma nova
      const [newConfig] = await db.insert(appConfig).values({
        name,
        shortName,
        themeColor, 
        backgroundColor,
        updatedBy: req.user.id,
        createdBy: req.user.id
      }).returning();
      
      res.json(newConfig);
    } else {
      // Se existir, atualiza a existente
      const [updatedConfig] = await db
        .update(appConfig)
        .set({
          name,
          shortName, 
          themeColor,
          backgroundColor,
          updatedBy: req.user.id,
          updatedAt: new Date()
        })
        .where(eq(appConfig.id, configs[0].id))
        .returning();
      
      res.json(updatedConfig);
    }
  } catch (error) {
    console.error("Erro ao atualizar configurações do PWA:", error);
    res.status(500).json({ message: "Erro ao atualizar configurações do PWA" });
  }
});

// Rota para fazer upload dos ícones
router.post("/api/app-config/icon", upload.single("icon"), async (req, res) => {
  if (!req.isAuthenticated() || req.user.nivelAcesso !== "admin") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }
  
  if (!req.file) {
    return res.status(400).json({ message: "Nenhum arquivo enviado" });
  }
  
  try {
    const { size } = req.body;
    if (!size || (size !== "192" && size !== "512")) {
      return res.status(400).json({ message: "Tamanho inválido. Use 192 ou 512" });
    }
    
    const iconFilename = `icon-${size}.png`;
    const iconPath = path.join(ICONS_DIR, iconFilename);
    
    // Redimensiona e otimiza o ícone
    await sharp(req.file.path)
      .resize(parseInt(size), parseInt(size))
      .png({ quality: 90 })
      .toFile(iconPath);
    
    // Limpa o arquivo temporário
    fs.unlinkSync(req.file.path);
    
    // Atualiza o caminho do ícone no banco de dados
    const configs = await db.select().from(appConfig);
    const iconField = size === "192" ? "icon192" : "icon512";
    const iconValue = `/icons/${iconFilename}`;
    
    if (configs.length === 0) {
      const values = {
        updatedBy: req.user.id,
        createdBy: req.user.id
      };
      values[iconField] = iconValue;
      
      await db.insert(appConfig).values(values);
    } else {
      const values = {
        updatedBy: req.user.id,
        updatedAt: new Date()
      };
      values[iconField] = iconValue;
      
      await db
        .update(appConfig)
        .set(values)
        .where(eq(appConfig.id, configs[0].id));
    }
    
    res.json({ 
      message: "Ícone atualizado com sucesso",
      iconPath: iconValue
    });
  } catch (error) {
    console.error("Erro ao processar o ícone:", error);
    res.status(500).json({ message: "Erro ao processar o ícone" });
    
    // Limpa o arquivo temporário em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Rota para gerar o manifest.json dinamicamente
router.get("/manifest.json", async (req, res) => {
  try {
    const configs = await db.select().from(appConfig);
    const config = configs.length > 0 ? configs[0] : null;
    
    if (!config) {
      // Se não houver configuração, retorna um manifest padrão
      return res.json({
        name: "DesignAuto",
        short_name: "DesignAuto",
        theme_color: "#4F46E5",
        background_color: "#FFFFFF",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      });
    }
    
    // Retorna o manifest com as configurações do banco
    res.json({
      name: config.name,
      short_name: config.shortName,
      theme_color: config.themeColor,
      background_color: config.backgroundColor,
      display: "standalone",
      scope: "/",
      start_url: "/",
      icons: [
        {
          src: config.icon192,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: config.icon512,
          sizes: "512x512",
          type: "image/png"
        }
      ]
    });
  } catch (error) {
    console.error("Erro ao gerar manifest.json:", error);
    res.status(500).json({ message: "Erro ao gerar manifest.json" });
  }
});

export default router;