import {
  User,
  InsertUser,
  Category,
  InsertCategory,
  Format,
  InsertFormat,
  FileType,
  InsertFileType,
  Collection,
  InsertCollection,
  Art,
  InsertArt,
  Testimonial,
  InsertTestimonial
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Format methods
  getFormats(): Promise<Format[]>;
  getFormatById(id: number): Promise<Format | undefined>;
  createFormat(format: InsertFormat): Promise<Format>;
  
  // File type methods
  getFileTypes(): Promise<FileType[]>;
  getFileTypeById(id: number): Promise<FileType | undefined>;
  createFileType(fileType: InsertFileType): Promise<FileType>;
  
  // Collection methods
  getCollections(page: number, limit: number, search?: string): Promise<{ collections: Collection[], totalCount: number }>;
  getFeaturedCollections(limit?: number): Promise<Collection[]>;
  getCollectionById(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  
  // Art methods
  getArts(page: number, limit: number, filters?: ArtFilters): Promise<{ arts: Art[], totalCount: number }>;
  getArtById(id: number): Promise<Art | undefined>;
  getArtsByCollectionId(collectionId: number): Promise<Art[]>;
  createArt(art: InsertArt): Promise<Art>;
  
  // Testimonial methods
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
}

interface ArtFilters {
  categoryId?: number | null;
  formatId?: number | null;
  fileTypeId?: number | null;
  search?: string;
  isPremium?: boolean;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private formats: Map<number, Format>;
  private fileTypes: Map<number, FileType>;
  private collections: Map<number, Collection>;
  private arts: Map<number, Art>;
  private testimonials: Map<number, Testimonial>;
  
  private currentUserId: number;
  private currentCategoryId: number;
  private currentFormatId: number;
  private currentFileTypeId: number;
  private currentCollectionId: number;
  private currentArtId: number;
  private currentTestimonialId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.formats = new Map();
    this.fileTypes = new Map();
    this.collections = new Map();
    this.arts = new Map();
    this.testimonials = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentFormatId = 1;
    this.currentFileTypeId = 1;
    this.currentCollectionId = 1;
    this.currentArtId = 1;
    this.currentTestimonialId = 1;
    
    // Initialize with sample data
    this.initData();
  }

  private initData() {
    // Sample Categories
    const categories = [
      { name: "Vendas", slug: "vendas" },
      { name: "Lavagem", slug: "lavagem" },
      { name: "Mecânica", slug: "mecanica" },
      { name: "Locação", slug: "locacao" },
      { name: "Seminovos", slug: "seminovos" },
      { name: "Promoções", slug: "promocoes" },
      { name: "Lançamentos", slug: "lancamentos" },
    ];
    
    categories.forEach(cat => {
      this.createCategory(cat);
    });
    
    // Sample Formats
    const formats = [
      { name: "Instagram", slug: "instagram" },
      { name: "Facebook", slug: "facebook" },
      { name: "Stories", slug: "stories" },
      { name: "Feed", slug: "feed" },
      { name: "Web Banner", slug: "web-banner" },
      { name: "WhatsApp", slug: "whatsapp" },
      { name: "Email", slug: "email" },
    ];
    
    formats.forEach(format => {
      this.createFormat(format);
    });
    
    // Sample File Types
    const fileTypes = [
      { name: "Canva", slug: "canva" },
      { name: "Google Drive", slug: "google-drive" },
    ];
    
    fileTypes.forEach(fileType => {
      this.createFileType(fileType);
    });
    
    // Sample Collections
    const collections = [
      {
        title: "Lavagem de Veículos",
        description: "Coleção com artes para divulgação de serviços de lavagem",
        imageUrl: "/assets/LAVAGEM 01.png",
        artCount: 42,
        formats: "Formatos variados",
        isPremium: true,
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        title: "Vendas de Carros",
        description: "Artes para divulgação e promoções de veículos",
        imageUrl: "/assets/VENDAS 10.png",
        artCount: 28,
        formats: "Formatos variados",
        isPremium: false,
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },
      {
        title: "Mecânica Especializada",
        description: "Coleção de artes para serviços mecânicos e manutenção",
        imageUrl: "/assets/MECÂNICA 08.png",
        artCount: 35,
        formats: "Formatos variados",
        isPremium: true,
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      },
      {
        title: "Locação de Veículos",
        description: "Artes para divulgação de serviços de locação e aluguel",
        imageUrl: "/assets/LOCAÇÃO 06.png",
        artCount: 19,
        formats: "Formatos variados",
        isPremium: false,
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      },
    ];
    
    const collectionIds = collections.map(collection => this.createCollection(collection).id);
    
    // Sample Arts
    const sampleArts = [
      {
        title: "Lavagem Profissional",
        imageUrl: "/assets/LAVAGEM 01.png",
        format: "Instagram",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample1",
        isPremium: false,
        categoryId: 2, // Lavagem
        collectionId: collectionIds[0],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Lavagem Premium",
        imageUrl: "/assets/LAVAGEM 03.png",
        format: "Facebook",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample2",
        isPremium: true,
        categoryId: 2, // Lavagem
        collectionId: collectionIds[0],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Lembrete - Lavagem",
        imageUrl: "/assets/LAVAGEM 04.png",
        format: "Stories",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample3",
        isPremium: false,
        categoryId: 2, // Lavagem
        collectionId: collectionIds[0],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Lavagem Premium R$69,99",
        imageUrl: "/assets/LAVAGEM 10.png",
        format: "Feed",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample4",
        isPremium: false,
        categoryId: 2, // Lavagem
        collectionId: collectionIds[0],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Lembrete de Manutenção",
        imageUrl: "/assets/MECÂNICA 08.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample5",
        isPremium: true,
        categoryId: 3, // Mecânica
        collectionId: collectionIds[2],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Revisão de Motos",
        imageUrl: "/assets/MECÂNICA MOTO 01.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample6",
        isPremium: false,
        categoryId: 3, // Mecânica
        collectionId: collectionIds[2],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Planos de Locação",
        imageUrl: "/assets/LOCAÇÃO 06.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample7",
        isPremium: false,
        categoryId: 4, // Locação
        collectionId: collectionIds[3],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Promoção Volkswagen",
        imageUrl: "/assets/VENDAS 10.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample8",
        isPremium: true,
        categoryId: 1, // Vendas
        collectionId: collectionIds[1],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "BMW X6 Premium",
        imageUrl: "/assets/VENDAS 17.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample9",
        isPremium: true,
        categoryId: 1, // Vendas
        collectionId: collectionIds[1],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Volkswagen Polo 2025",
        imageUrl: "/assets/VENDAS 32.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample10",
        isPremium: true,
        categoryId: 1, // Vendas
        collectionId: collectionIds[1],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Vantagens Seminovo",
        imageUrl: "/assets/VENDAS 36.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample11",
        isPremium: true,
        categoryId: 5, // Seminovos
        collectionId: collectionIds[1],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
      {
        title: "Chaves do Próximo Carro",
        imageUrl: "/assets/VENDAS 04.png",
        format: "Square",
        fileType: "Canva",
        editUrl: "https://www.canva.com/design/sample12",
        isPremium: false,
        categoryId: 1, // Vendas
        collectionId: collectionIds[1],
        width: 1080,
        height: 1080,
        aspectRatio: "1:1"
      },
    ];
    
    sampleArts.forEach(art => this.createArt(art));
    
    // Sample Testimonials
    const testimonials = [
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
        rating: 4.5,
        quote: "As artes são de alta qualidade e o sistema é muito fácil de usar. Ótimo custo-benefício para concessionárias de todos os tamanhos."
      }
    ];
    
    testimonials.forEach(testimonial => this.createTestimonial(testimonial));
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "premium"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, role };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  // Format methods
  async getFormats(): Promise<Format[]> {
    return Array.from(this.formats.values());
  }
  
  async getFormatById(id: number): Promise<Format | undefined> {
    return this.formats.get(id);
  }
  
  async createFormat(format: InsertFormat): Promise<Format> {
    const id = this.currentFormatId++;
    const newFormat: Format = { ...format, id };
    this.formats.set(id, newFormat);
    return newFormat;
  }
  
  // File type methods
  async getFileTypes(): Promise<FileType[]> {
    return Array.from(this.fileTypes.values());
  }
  
  async getFileTypeById(id: number): Promise<FileType | undefined> {
    return this.fileTypes.get(id);
  }
  
  async createFileType(fileType: InsertFileType): Promise<FileType> {
    const id = this.currentFileTypeId++;
    const newFileType: FileType = { ...fileType, id };
    this.fileTypes.set(id, newFileType);
    return newFileType;
  }
  
  // Collection methods
  async getCollections(page: number, limit: number, search?: string): Promise<{ collections: Collection[], totalCount: number }> {
    let collections = Array.from(this.collections.values());
    
    if (search) {
      const searchLower = search.toLowerCase();
      collections = collections.filter(collection => 
        collection.title.toLowerCase().includes(searchLower) || 
        collection.description.toLowerCase().includes(searchLower)
      );
    }
    
    const totalCount = collections.length;
    const paginatedCollections = collections
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice((page - 1) * limit, page * limit);
    
    return { collections: paginatedCollections, totalCount };
  }
  
  async getFeaturedCollections(limit = 4): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }
  
  async getCollectionById(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }
  
  async createCollection(collection: InsertCollection): Promise<Collection> {
    const id = this.currentCollectionId++;
    const now = new Date().toISOString();
    const newCollection: Collection = { 
      ...collection, 
      id, 
      createdAt: now,
      updatedAt: collection.updatedAt || now
    };
    this.collections.set(id, newCollection);
    return newCollection;
  }
  
  // Art methods
  async getArts(page: number, limit: number, filters?: ArtFilters): Promise<{ arts: Art[], totalCount: number }> {
    let arts = Array.from(this.arts.values());
    
    if (filters) {
      if (filters.categoryId) {
        arts = arts.filter(art => art.categoryId === filters.categoryId);
      }
      
      if (filters.formatId) {
        const format = await this.getFormatById(filters.formatId);
        if (format) {
          arts = arts.filter(art => art.format === format.name);
        }
      }
      
      if (filters.fileTypeId) {
        const fileType = await this.getFileTypeById(filters.fileTypeId);
        if (fileType) {
          arts = arts.filter(art => art.fileType === fileType.name);
        }
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        arts = arts.filter(art => art.title.toLowerCase().includes(searchLower));
      }
      
      if (filters.isPremium !== undefined) {
        arts = arts.filter(art => art.isPremium === filters.isPremium);
      }
    }
    
    const totalCount = arts.length;
    const paginatedArts = arts
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice((page - 1) * limit, page * limit);
    
    return { arts: paginatedArts, totalCount };
  }
  
  async getArtById(id: number): Promise<Art | undefined> {
    return this.arts.get(id);
  }
  
  async getArtsByCollectionId(collectionId: number): Promise<Art[]> {
    return Array.from(this.arts.values())
      .filter(art => art.collectionId === collectionId);
  }
  
  async createArt(art: InsertArt): Promise<Art> {
    const id = this.currentArtId++;
    const now = new Date().toISOString();
    const newArt: Art = { 
      ...art, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.arts.set(id, newArt);
    
    // Update collection art count
    const collection = await this.getCollectionById(art.collectionId);
    if (collection) {
      const updatedCollection = { 
        ...collection, 
        artCount: collection.artCount + 1,
        updatedAt: now
      };
      this.collections.set(collection.id, updatedCollection);
    }
    
    return newArt;
  }
  
  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }
  
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.currentTestimonialId++;
    const now = new Date().toISOString();
    const newTestimonial: Testimonial = { 
      ...testimonial, 
      id, 
      createdAt: now
    };
    this.testimonials.set(id, newTestimonial);
    return newTestimonial;
  }
}

export const storage = new MemStorage();
