import { db } from "./db";
import {
  users,
  categories,
  formats,
  fileTypes,
  collections,
  arts,
  testimonials,
  InsertCategory,
  InsertFormat,
  InsertFileType,
  InsertCollection,
  InsertArt,
  InsertTestimonial,
  InsertUser
} from "@shared/schema";

export async function initializeDatabase() {
  try {
    console.log("Inicializando o banco de dados...");
    
    // Verifica se já existem categorias
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length > 0) {
      console.log("Banco de dados já inicializado.");
      return;
    }
    
    // Categorias
    const categoryData: InsertCategory[] = [
      { name: "Vendas", slug: "vendas" },
      { name: "Lavagem", slug: "lavagem" },
      { name: "Mecânica", slug: "mecanica" },
      { name: "Locação", slug: "locacao" },
      { name: "Seminovos", slug: "seminovos" },
      { name: "Promoções", slug: "promocoes" },
      { name: "Lançamentos", slug: "lancamentos" },
    ];
    
    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    console.log(`${insertedCategories.length} categorias inseridas.`);
    
    // Formatos
    const formatData: InsertFormat[] = [
      { name: "Instagram", slug: "instagram" },
      { name: "Facebook", slug: "facebook" },
      { name: "Stories", slug: "stories" },
      { name: "Feed", slug: "feed" },
      { name: "Web Banner", slug: "web-banner" },
      { name: "WhatsApp", slug: "whatsapp" },
      { name: "Email", slug: "email" },
    ];
    
    const insertedFormats = await db.insert(formats).values(formatData).returning();
    console.log(`${insertedFormats.length} formatos inseridos.`);
    
    // Tipos de arquivo
    const fileTypeData: InsertFileType[] = [
      { name: "Canva", slug: "canva" },
      { name: "Google Drive", slug: "google-drive" },
    ];
    
    const insertedFileTypes = await db.insert(fileTypes).values(fileTypeData).returning();
    console.log(`${insertedFileTypes.length} tipos de arquivo inseridos.`);
    
    // Coleções
    const collectionData: InsertCollection[] = [
      {
        title: "Lavagem de Veículos",
        description: "Coleção com artes para divulgação de serviços de lavagem",
        imageUrl: "/assets/LAVAGEM 01.png",
        artCount: 42,
        formats: "Formatos variados",
        isPremium: true
      },
      {
        title: "Vendas de Carros",
        description: "Artes para divulgação e promoções de veículos",
        imageUrl: "/assets/VENDAS 10.png",
        artCount: 28,
        formats: "Formatos variados",
        isPremium: false
      },
      {
        title: "Mecânica Especializada",
        description: "Coleção de artes para serviços mecânicos e manutenção",
        imageUrl: "/assets/MECÂNICA 08.png",
        artCount: 35,
        formats: "Formatos variados",
        isPremium: true
      },
      {
        title: "Locação de Veículos",
        description: "Artes para divulgação de serviços de locação e aluguel",
        imageUrl: "/assets/LOCAÇÃO 06.png",
        artCount: 19,
        formats: "Formatos variados",
        isPremium: false
      },
    ];
    
    const insertedCollections = await db.insert(collections).values(collectionData).returning();
    console.log(`${insertedCollections.length} coleções inseridas.`);
    
    // Mapa para facilitar acesso
    const categoryMap = new Map(insertedCategories.map(cat => [cat.slug, cat.id]));
    const collectionIds = insertedCollections.map(c => c.id);
    
    // Artes
    const artData: InsertArt[] = [
      {
        title: "Lavagem Profissional",
        imageUrl: "/assets/LAVAGEM 01.png",
        format: "Instagram",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample1",
        isPremium: false,
        categoryId: categoryMap.get("lavagem") || 2,
        collectionId: collectionIds[0]
      },
      {
        title: "Lavagem Premium",
        imageUrl: "/assets/LAVAGEM 03.png",
        format: "Facebook",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample2",
        isPremium: true,
        categoryId: categoryMap.get("lavagem") || 2,
        collectionId: collectionIds[0]
      },
      {
        title: "Lembrete - Lavagem",
        imageUrl: "/assets/LAVAGEM 04.png",
        format: "Stories",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample3",
        isPremium: false,
        categoryId: categoryMap.get("lavagem") || 2,
        collectionId: collectionIds[0]
      },
      {
        title: "Lavagem Premium R$69,99",
        imageUrl: "/assets/LAVAGEM 10.png",
        format: "Feed",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample4",
        isPremium: false,
        categoryId: categoryMap.get("lavagem") || 2,
        collectionId: collectionIds[0]
      },
      {
        title: "Lembrete de Manutenção",
        imageUrl: "/assets/MECÂNICA 08.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample5",
        isPremium: true,
        categoryId: categoryMap.get("mecanica") || 3,
        collectionId: collectionIds[2]
      },
      {
        title: "Revisão de Motos",
        imageUrl: "/assets/MECÂNICA MOTO 01.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample6",
        isPremium: false,
        categoryId: categoryMap.get("mecanica") || 3,
        collectionId: collectionIds[2]
      },
      {
        title: "Planos de Locação",
        imageUrl: "/assets/LOCAÇÃO 06.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample7",
        isPremium: false,
        categoryId: categoryMap.get("locacao") || 4,
        collectionId: collectionIds[3]
      },
      {
        title: "Promoção Volkswagen",
        imageUrl: "/assets/VENDAS 10.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample8",
        isPremium: true,
        categoryId: categoryMap.get("vendas") || 1,
        collectionId: collectionIds[1]
      },
      {
        title: "BMW X6 Premium",
        imageUrl: "/assets/VENDAS 17.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample9",
        isPremium: true,
        categoryId: categoryMap.get("vendas") || 1,
        collectionId: collectionIds[1]
      },
      {
        title: "Volkswagen Polo 2025",
        imageUrl: "/assets/VENDAS 32.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample10",
        isPremium: true,
        categoryId: categoryMap.get("vendas") || 1,
        collectionId: collectionIds[1]
      },
      {
        title: "Vantagens Seminovo",
        imageUrl: "/assets/VENDAS 36.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample11",
        isPremium: true,
        categoryId: categoryMap.get("seminovos") || 5,
        collectionId: collectionIds[1]
      },
      {
        title: "Chaves do Próximo Carro",
        imageUrl: "/assets/VENDAS 04.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample12",
        isPremium: false,
        categoryId: categoryMap.get("vendas") || 1,
        collectionId: collectionIds[1]
      },
    ];
    
    const insertedArts = await db.insert(arts).values(artData).returning();
    console.log(`${insertedArts.length} artes inseridas.`);
    
    // Depoimentos
    const testimonialData: InsertTestimonial[] = [
      {
        name: "Ricardo Silva",
        role: "Vendedor",
        company: "TopCar Veículos",
        avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
        rating: 5,
        quote: "Desde que comecei a usar o DesignAuto, minhas publicações nas redes sociais ficaram muito mais profissionais. Os clientes estão interagindo mais e as vendas aumentaram."
      },
      {
        name: "Ana Oliveira",
        role: "Gerente de Marketing",
        company: "Auto Premium",
        avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
        rating: 5,
        quote: "Economizo horas toda semana com as artes prontas. Antes gastava muito tempo tentando criar posts no Photoshop, agora é só personalizar e publicar."
      },
      {
        name: "Carlos Mendes",
        role: "Diretor",
        company: "Rede AutoStore",
        avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg",
        rating: 4,
        quote: "As artes são de alta qualidade e o sistema é muito fácil de usar. Ótimo custo-benefício para concessionárias de todos os tamanhos."
      }
    ];
    
    const insertedTestimonials = await db.insert(testimonials).values(testimonialData).returning();
    console.log(`${insertedTestimonials.length} depoimentos inseridos.`);
    
    // Usuário admin
    const userData: InsertUser = {
      username: "admin",
      password: "admin123",
      role: "premium"
    };
    
    const insertedUser = await db.insert(users).values(userData).returning();
    console.log(`${insertedUser.length} usuário administrador inserido.`);
    
    console.log("Banco de dados inicializado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar o banco de dados:", error);
  }
}