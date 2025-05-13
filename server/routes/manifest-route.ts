import { Router, Request, Response } from "express";
import { db } from "../db";
import { appConfig } from "@shared/schema";

const router = Router();

/**
 * Rota para gerar o manifest.json dinamicamente com base nas configurações do banco de dados
 * Esta rota substitui o arquivo estático em public/manifest.json
 */
router.get("/manifest.json", async (req: Request, res: Response) => {
  try {
    // Busca as configurações do PWA no banco de dados
    const configs = await db.select().from(appConfig);
    const config = configs.length > 0 ? configs[0] : null;
    
    if (!config) {
      // Se não existir configuração, retorna o manifest padrão
      return res.json({
        name: "DesignAuto",
        short_name: "DesignAuto",
        description: "Plataforma de designs automotivos totalmente editáveis",
        start_url: "/",
        display: "standalone",
        background_color: "#FFFFFF",
        theme_color: "#4F46E5",
        orientation: "any",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      });
    }
    
    // Retorna o manifest personalizado com base nas configurações
    res.json({
      name: config.name,
      short_name: config.shortName,
      description: "Plataforma de designs automotivos totalmente editáveis",
      start_url: "/",
      display: "standalone",
      background_color: config.backgroundColor,
      theme_color: config.themeColor,
      orientation: "any",
      icons: [
        {
          src: config.icon192 || "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: config.icon512 || "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    });
    
    // Define o tipo de conteúdo como application/json e o cache por 24 horas
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=86400");
    
  } catch (error) {
    console.error("Erro ao gerar manifest.json:", error);
    // Em caso de erro, retorna o manifest padrão
    res.json({
      name: "DesignAuto",
      short_name: "DesignAuto",
      description: "Plataforma de designs automotivos totalmente editáveis",
      start_url: "/",
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: "#4F46E5",
      orientation: "any",
      icons: [
        {
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    });
  }
});

export default router;