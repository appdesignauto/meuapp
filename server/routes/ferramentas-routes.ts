import express, { Request, Response } from "express";
import { eq, asc, desc, and, sql } from "drizzle-orm";
import slugify from "slugify";
import multer from 'multer';
import path from 'path';
import { ferramentas, ferramentasCategorias } from "@shared/schema";
import { db } from "../db";
import { isAdmin, isAuthenticated } from "../middleware";

// Configurar storage para o multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'temp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configuração do multer para processamento de FormData
const upload = multer({ storage });

const router = express.Router();

// Obter todas as categorias
router.get("/api/ferramentas/categorias", async (req: Request, res: Response) => {
  try {
    const categorias = await db.query.ferramentasCategorias.findMany({
      where: eq(ferramentasCategorias.ativo, true),
      orderBy: [asc(ferramentasCategorias.ordem), asc(ferramentasCategorias.nome)],
      with: {
        ferramentas: {
          where: eq(ferramentas.ativo, true),
          orderBy: [asc(ferramentas.ordem), asc(ferramentas.nome)]
        }
      }
    });
    
    res.json(categorias);
  } catch (error) {
    console.error("Erro ao buscar categorias de ferramentas:", error);
    res.status(500).json({ message: "Erro ao buscar categorias" });
  }
});

// Obter categoria específica por slug
router.get("/api/ferramentas/categorias/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const categoria = await db.query.ferramentasCategorias.findFirst({
      where: and(
        eq(ferramentasCategorias.slug, slug),
        eq(ferramentasCategorias.ativo, true)
      ),
      with: {
        ferramentas: {
          where: eq(ferramentas.ativo, true),
          orderBy: [asc(ferramentas.ordem), asc(ferramentas.nome)]
        }
      }
    });
    
    if (!categoria) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }
    
    res.json(categoria);
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);
    res.status(500).json({ message: "Erro ao buscar categoria" });
  }
});

// Obter todas as ferramentas
router.get("/api/ferramentas", async (req: Request, res: Response) => {
  try {
    const categoria = req.query.categoria as string | undefined;
    const searchTerm = req.query.search as string | undefined;
    const busca = req.query.busca as string | undefined;
    
    // Condição base: ferramentas ativas
    let conditions = [eq(ferramentas.ativo, true)];
    
    // Adicionar condição de categoria se especificada
    if (categoria) {
      const categoriaEncontrada = await db.query.ferramentasCategorias.findFirst({
        where: eq(ferramentasCategorias.slug, categoria)
      });
      
      if (categoriaEncontrada) {
        conditions.push(eq(ferramentas.categoriaId, categoriaEncontrada.id));
      }
    }
    
    // Adicionar condição de busca se especificada
    if (searchTerm || busca) {
      const termoBusca = `%${(searchTerm || busca || "").toLowerCase()}%`;
      conditions.push(
        sql`LOWER(${ferramentas.nome}) LIKE ${termoBusca} OR LOWER(${ferramentas.descricao}) LIKE ${termoBusca}`
      );
    }
    
    // Executar consulta com condições combinadas
    const query = db.select().from(ferramentas);
    
    // Adicionar condição where
    query.where(conditions.length > 1 ? and(...conditions) : conditions[0]);
    
    // Adicionar ordenação
    query.orderBy(asc(ferramentas.ordem));
    
    // Executar consulta
    const todasFerramentas = await query;
    
    // Obter categorias para cada ferramenta
    const ferramentasComCategorias = await Promise.all(
      todasFerramentas.map(async (ferramenta) => {
        const categoria = await db.query.ferramentasCategorias.findFirst({
          where: eq(ferramentasCategorias.id, ferramenta.categoriaId)
        });
        
        return {
          ...ferramenta,
          categoria: categoria || null
        };
      })
    );
    
    res.json(ferramentasComCategorias);
  } catch (error) {
    console.error("Erro ao buscar ferramentas:", error);
    res.status(500).json({ message: "Erro ao buscar ferramentas" });
  }
});

// Obter todas as ferramentas para o painel administrativo
router.get("/api/ferramentas/all", isAdmin, async (req: Request, res: Response) => {
  try {
    // Buscar todas as ferramentas, incluindo as inativas
    const todasFerramentas = await db.query.ferramentas.findMany({
      orderBy: [asc(ferramentas.ordem), asc(ferramentas.nome)],
      with: {
        categoria: true
      }
    });
    
    res.json(todasFerramentas);
  } catch (error) {
    console.error("Erro ao buscar todas as ferramentas:", error);
    res.status(500).json({ message: "Erro ao buscar ferramentas" });
  }
});

// Obter ferramenta específica
router.get("/api/ferramentas/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const ferramenta = await db.query.ferramentas.findFirst({
      where: and(
        eq(ferramentas.id, id),
        eq(ferramentas.ativo, true)
      ),
      with: {
        categoria: true
      }
    });
    
    if (!ferramenta) {
      return res.status(404).json({ message: "Ferramenta não encontrada" });
    }
    
    res.json(ferramenta);
  } catch (error) {
    console.error("Erro ao buscar ferramenta:", error);
    res.status(500).json({ message: "Erro ao buscar ferramenta" });
  }
});

// *** ROTAS DE ADMINISTRAÇÃO ***

// Criar categoria (admin)
router.post("/api/admin/ferramentas/categorias", isAdmin, async (req: Request, res: Response) => {
  try {
    const { nome, descricao, icone, ordem } = req.body;
    
    // Validar dados
    if (!nome) {
      return res.status(400).json({ message: "Nome é obrigatório" });
    }
    
    // Criar slug
    const slug = slugify(nome, { lower: true, strict: true });
    
    // Verificar se já existe categoria com este slug
    const categoriaExistente = await db.query.ferramentasCategorias.findFirst({
      where: eq(ferramentasCategorias.slug, slug)
    });
    
    if (categoriaExistente) {
      return res.status(400).json({ message: "Já existe uma categoria com este nome" });
    }
    
    // Inserir a nova categoria
    const [novaCategoria] = await db.insert(ferramentasCategorias)
      .values({
        nome,
        slug,
        descricao,
        icone,
        ordem: ordem || 0,
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      })
      .returning();
    
    res.status(201).json(novaCategoria);
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ message: "Erro ao criar categoria" });
  }
});

// Atualizar categoria (admin)
router.put("/api/admin/ferramentas/categorias/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, descricao, icone, ordem, ativo } = req.body;
    
    // Validar dados
    if (!nome) {
      return res.status(400).json({ message: "Nome é obrigatório" });
    }
    
    // Verificar se a categoria existe
    const categoriaExistente = await db.query.ferramentasCategorias.findFirst({
      where: eq(ferramentasCategorias.id, id)
    });
    
    if (!categoriaExistente) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }
    
    // Criar slug se o nome foi alterado
    const slug = nome !== categoriaExistente.nome 
      ? slugify(nome, { lower: true, strict: true }) 
      : categoriaExistente.slug;
    
    // Verificar se já existe outra categoria com este slug
    if (nome !== categoriaExistente.nome) {
      const outraCategoria = await db.query.ferramentasCategorias.findFirst({
        where: and(
          eq(ferramentasCategorias.slug, slug),
          sql`${ferramentasCategorias.id} != ${id}`
        )
      });
      
      if (outraCategoria) {
        return res.status(400).json({ message: "Já existe uma categoria com este nome" });
      }
    }
    
    // Atualizar a categoria
    const [categoriaAtualizada] = await db.update(ferramentasCategorias)
      .set({
        nome,
        slug,
        descricao,
        icone,
        ordem: ordem !== undefined ? ordem : categoriaExistente.ordem,
        ativo: ativo !== undefined ? ativo : categoriaExistente.ativo,
        atualizadoEm: new Date()
      })
      .where(eq(ferramentasCategorias.id, id))
      .returning();
    
    res.json(categoriaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    res.status(500).json({ message: "Erro ao atualizar categoria" });
  }
});

// Deletar categoria (admin)
router.delete("/api/admin/ferramentas/categorias/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verificar se a categoria existe
    const categoriaExistente = await db.query.ferramentasCategorias.findFirst({
      where: eq(ferramentasCategorias.id, id)
    });
    
    if (!categoriaExistente) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }
    
    // Verificar se existem ferramentas nesta categoria
    const ferramentasNaCategoria = await db.query.ferramentas.findMany({
      where: eq(ferramentas.categoriaId, id)
    });
    
    if (ferramentasNaCategoria.length > 0) {
      return res.status(400).json({ 
        message: "Esta categoria possui ferramentas vinculadas. Remova-as ou mova-as para outra categoria primeiro." 
      });
    }
    
    // Excluir a categoria
    await db.delete(ferramentasCategorias)
      .where(eq(ferramentasCategorias.id, id));
    
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    res.status(500).json({ message: "Erro ao excluir categoria" });
  }
});

// Criar ferramenta (admin)
router.post("/api/admin/ferramentas", isAdmin, upload.none(), async (req: Request, res: Response) => {
  try {
    // Ajustando os nomes dos campos para corresponder ao frontend
    const nome = req.body.nome;
    const descricao = req.body.descricao;
    const imageUrl = req.body.imagemUrl; // Campo vindo do frontend
    const websiteUrl = req.body.url; // Campo vindo do frontend
    const isExterno = req.body.externo === 'true'; 
    const isNovo = req.body.novo === 'true';
    const categoriaId = parseInt(req.body.categoriaId);
    const ordem = req.body.ordem ? parseInt(req.body.ordem) : 0;
    
    console.log('Criando ferramenta:', { nome, imageUrl, websiteUrl, categoriaId });
    
    // Validar dados
    if (!nome || !websiteUrl || !categoriaId) {
      return res.status(400).json({ message: "Nome, URL e categoria são obrigatórios" });
    }
    
    // Verificar se existe imagem
    if (!imageUrl) {
      return res.status(400).json({ message: "Imagem é obrigatória para novas ferramentas" });
    }
    
    // Verificar se a categoria existe
    const categoriaExistente = await db.query.ferramentasCategorias.findFirst({
      where: eq(ferramentasCategorias.id, categoriaId)
    });
    
    if (!categoriaExistente) {
      return res.status(400).json({ message: "Categoria não encontrada" });
    }
    
    // Inserir a nova ferramenta
    const [novaFerramenta] = await db.insert(ferramentas)
      .values({
        nome,
        descricao,
        imageUrl,
        websiteUrl,
        isExterno: isExterno !== undefined ? isExterno : true,
        isNovo: isNovo !== undefined ? isNovo : false,

        categoriaId,
        ordem: ordem || 0,
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      })
      .returning();
    
    res.status(201).json(novaFerramenta);
  } catch (error) {
    console.error("Erro ao criar ferramenta:", error);
    
    // Mensagem de erro mais detalhada para ajudar no diagnóstico
    const errorMessage = error instanceof Error 
      ? `Erro ao criar ferramenta: ${error.message}` 
      : "Erro desconhecido ao criar ferramenta";
    
    res.status(500).json({ 
      message: errorMessage,
      details: req.body // Incluir detalhes do que foi recebido para diagnóstico
    });
  }
});

// Atualizar ferramenta (admin)
router.put("/api/admin/ferramentas/:id", isAdmin, upload.none(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Log detalhado do corpo da requisição para depuração
    console.log('Corpo da requisição (req.body):', req.body);
    console.log('Headers da requisição:', req.headers);
    
    // Verificando se o req.body não está vazio
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        message: "Dados da requisição vazios ou mal formatados",
        details: { 
          contentType: req.headers['content-type'],
          bodyKeys: Object.keys(req.body),
          bodyLength: JSON.stringify(req.body).length
        }
      });
    }
    
    // Ajustando os nomes dos campos para corresponder ao frontend
    // Para aplicações que enviam formulários como FormData
    const nome = req.body.nome;
    const descricao = req.body.descricao;
    const imageUrl = req.body.imagemUrl; // Campo vindo do frontend
    const websiteUrl = req.body.url; // Campo vindo do frontend
    const isExterno = req.body.externo === 'true'; 
    const isNovo = req.body.novo === 'true';
    let categoriaId: number;
    
    try {
      categoriaId = parseInt(req.body.categoriaId);
      if (isNaN(categoriaId)) {
        return res.status(400).json({ 
          message: "categoriaId inválido", 
          details: { raw: req.body.categoriaId }
        });
      }
    } catch (e) {
      console.error('Erro ao converter categoriaId:', e);
      return res.status(400).json({ 
        message: "Erro ao converter categoriaId", 
        details: { error: e, raw: req.body.categoriaId } 
      });
    }
    
    const ordem = req.body.ordem ? parseInt(req.body.ordem) : 0;
    const ativo = true; // Por padrão, ferramentas atualizadas estão ativas
    
    console.log('Atualizando ferramenta:', { id, nome, imageUrl, websiteUrl, categoriaId });
    
    // Validar dados essenciais
    if (!nome) {
      return res.status(400).json({ 
        message: "Nome é obrigatório",
        details: { providedValue: nome }
      });
    }
    
    if (!websiteUrl) {
      return res.status(400).json({ 
        message: "URL é obrigatória",
        details: { providedValue: websiteUrl }
      });
    }
    
    if (!categoriaId) {
      return res.status(400).json({ 
        message: "Categoria é obrigatória",
        details: { providedValue: categoriaId }
      });
    }
    
    // Verificar se a ferramenta existe
    const ferramentaExistente = await db.query.ferramentas.findFirst({
      where: eq(ferramentas.id, id)
    });
    
    if (!ferramentaExistente) {
      return res.status(404).json({ 
        message: "Ferramenta não encontrada",
        details: { id }
      });
    }
    
    // Verificar se a categoria existe
    const categoriaExistente = await db.query.ferramentasCategorias.findFirst({
      where: eq(ferramentasCategorias.id, categoriaId)
    });
    
    if (!categoriaExistente) {
      return res.status(400).json({ 
        message: "Categoria não encontrada",
        details: { categoriaId }
      });
    }
    
    // Preparar os dados para atualização com valores existentes como fallback
    const dadosAtualizacao = {
      nome,
      descricao: descricao || ferramentaExistente.descricao,
      imageUrl: imageUrl || ferramentaExistente.imageUrl,
      websiteUrl,
      isExterno: isExterno !== undefined ? isExterno : ferramentaExistente.isExterno,
      isNovo: isNovo !== undefined ? isNovo : ferramentaExistente.isNovo,
      categoriaId,
      ordem: ordem !== undefined ? ordem : ferramentaExistente.ordem,
      ativo: ativo !== undefined ? ativo : ferramentaExistente.ativo,
      atualizadoEm: new Date()
    };
    
    console.log('Dados para atualização:', dadosAtualizacao);
    
    // Atualizar a ferramenta
    const [ferramentaAtualizada] = await db.update(ferramentas)
      .set(dadosAtualizacao)
      .where(eq(ferramentas.id, id))
      .returning();
    
    res.json(ferramentaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar ferramenta:", error);
    
    // Mensagem de erro mais detalhada para ajudar no diagnóstico
    const errorMessage = error instanceof Error 
      ? `Erro ao atualizar ferramenta: ${error.message}` 
      : "Erro desconhecido ao atualizar ferramenta";
    
    res.status(500).json({ 
      message: errorMessage,
      details: req.body // Incluir detalhes do que foi recebido para diagnóstico
    });
  }
});

// Deletar ferramenta (admin)
router.delete("/api/admin/ferramentas/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verificar se a ferramenta existe
    const ferramentaExistente = await db.query.ferramentas.findFirst({
      where: eq(ferramentas.id, id)
    });
    
    if (!ferramentaExistente) {
      return res.status(404).json({ message: "Ferramenta não encontrada" });
    }
    
    // Excluir a ferramenta
    await db.delete(ferramentas)
      .where(eq(ferramentas.id, id));
    
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir ferramenta:", error);
    res.status(500).json({ message: "Erro ao excluir ferramenta" });
  }
});

export default router;