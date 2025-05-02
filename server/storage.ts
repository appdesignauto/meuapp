import * as schema from "@shared/schema";
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
  InsertTestimonial,
  Favorite,
  InsertFavorite,
  View,
  InsertView,
  Download,
  InsertDownload,
  Subscription,
  InsertSubscription,
  CommunityPost,
  InsertCommunityPost,
  CommunityComment,
  InsertCommunityComment,
  UserPreferences,
  InsertUserPreferences,
  UserStats,
  InsertUserStats,
  DesignerStat,
  InsertDesignerStat,
  UserPermission,
  InsertUserPermission,
  UserFollow,
  InsertUserFollow,
  users,
  categories,
  formats,
  fileTypes,
  collections,
  arts,
  testimonials,
  favorites,
  views,
  downloads,
  subscriptions,
  communityPosts,
  communityComments,
  userPreferences,
  userStats,
  designerStats,
  userPermissions,
  userFollows
} from "@shared/schema";

import { db } from "./db";
import { eq, like, desc, and, or, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserProfile(id: number, data: { name?: string; bio?: string; profileImageUrl?: string }): Promise<User | undefined>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  updateUserLastLogin(id: number, lastLogin: Date): Promise<User | undefined>;
  updateUserSupabaseId(userId: number, supabaseId: string | null): Promise<User>;
  updateUserEmailConfirmed(userId: number, confirmed: boolean): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Format methods
  getFormats(): Promise<Format[]>;
  getFormatById(id: number): Promise<Format | undefined>;
  createFormat(format: InsertFormat): Promise<Format>;
  updateFormat(id: number, format: Partial<InsertFormat>): Promise<Format | undefined>;
  deleteFormat(id: number): Promise<boolean>;
  
  // File type methods
  getFileTypes(): Promise<FileType[]>;
  getFileTypeById(id: number): Promise<FileType | undefined>;
  createFileType(fileType: InsertFileType): Promise<FileType>;
  updateFileType(id: number, fileType: Partial<InsertFileType>): Promise<FileType | undefined>;
  deleteFileType(id: number): Promise<boolean>;
  
  // Collection methods
  getCollections(page: number, limit: number, search?: string): Promise<{ collections: Collection[], totalCount: number }>;
  getFeaturedCollections(limit?: number): Promise<Collection[]>;
  getCollectionById(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  
  // Art methods
  getArts(page: number, limit: number, filters?: ArtFilters): Promise<{ arts: Art[], totalCount: number }>;
  getArtById(id: number): Promise<Art | undefined>;
  getArtsByCollectionId(collectionId: number): Promise<Art[]>;
  getRelatedArts(artId: number, limit?: number): Promise<Art[]>;
  createArt(art: InsertArt): Promise<Art>;
  updateArt(id: number, art: Partial<InsertArt>): Promise<Art | undefined>;
  deleteArt(id: number): Promise<boolean>;
  
  // Testimonial methods
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  
  // Favorite methods
  getFavoritesByUserId(userId: number): Promise<Favorite[]>;
  getFavorite(userId: number, artId: number): Promise<Favorite | undefined>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: number, artId: number): Promise<boolean>;
  
  // View methods
  getViewsByArtId(artId: number): Promise<View[]>;
  getViewsByUserId(userId: number): Promise<View[]>;
  createView(view: InsertView): Promise<View>;
  getViewsCountByArtId(artId: number): Promise<number>;
  
  // Download methods
  getDownloadsByUserId(userId: number): Promise<Download[]>;
  getDownloadsByArtId(artId: number): Promise<Download[]>;
  createDownload(download: InsertDownload): Promise<Download>;
  getDownloadsCountByArtId(artId: number): Promise<number>;
  
  // Subscription methods
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  cancelSubscription(userId: number): Promise<Subscription | undefined>;
  
  // Community Post methods
  getCommunityPosts(page: number, limit: number, status?: string): Promise<{ posts: CommunityPost[], totalCount: number }>;
  getCommunityPostById(id: number): Promise<CommunityPost | undefined>;
  getCommunityPostsByUserId(userId: number): Promise<CommunityPost[]>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  updateCommunityPostStatus(id: number, status: string): Promise<CommunityPost | undefined>;
  
  // Community Comment methods
  getCommunityCommentsByPostId(postId: number): Promise<CommunityComment[]>;
  createCommunityComment(comment: InsertCommunityComment): Promise<CommunityComment>;
  updateCommunityComment(id: number, content: string): Promise<CommunityComment | undefined>;
  hideCommunityComment(id: number, isHidden: boolean): Promise<CommunityComment | undefined>;
  
  // User Preferences methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, data: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // User Stats methods
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, data: Partial<InsertUserStats>): Promise<UserStats | undefined>;
  
  // Designer Stats methods
  getDesignerStats(userId: number): Promise<{ followers: number; totalArts: number; } | undefined>;
  getDesignerStatsByArtId(userId: number, artId: number): Promise<DesignerStat | undefined>;
  createDesignerStats(stats: InsertDesignerStat): Promise<DesignerStat>;
  updateDesignerStats(userId: number, artId: number, data: Partial<InsertDesignerStat>): Promise<DesignerStat | undefined>;
  
  // User Permissions methods
  getUserPermissions(userId: number): Promise<UserPermission[]>;
  createUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  deleteUserPermission(id: number): Promise<boolean>;
  
  // Art view methods
  recordView(view: InsertView): Promise<View>;
  updateArtViewCount(artId: number, viewCount: number): Promise<boolean>;
  
  // Designer methods
  getArtsByDesignerId(designerId: number, limit?: number): Promise<Art[]>;
  getDesignerProfile(designerId: number): Promise<User | undefined>;
  
  // Follow methods
  followUser(followerId: number, followingId: number): Promise<UserFollow>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  getFollowerCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
  updateFollowerCount(userId: number, count: number): Promise<boolean>;
  updateFollowingCount(userId: number, count: number): Promise<boolean>;
  getFollowingDesignersArts(userId: number, limit?: number): Promise<Art[]>;
  
  // Email verification methods
  updateUserEmailConfirmed(userId: number, confirmed: boolean): Promise<User>;
}

interface ArtFilters {
  categoryId?: number | null;
  formatId?: number | null;
  fileTypeId?: number | null;
  search?: string;
  isPremium?: boolean;
  isVisible?: boolean;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private formats: Map<number, Format>;
  private fileTypes: Map<number, FileType>;
  private collections: Map<number, Collection>;
  private arts: Map<number, Art>;
  private testimonials: Map<number, Testimonial>;
  private favorites: Map<number, Favorite>;
  private views: Map<number, View>;
  private downloads: Map<number, Download>;
  private subscriptions: Map<number, Subscription>;
  private communityPosts: Map<number, CommunityPost>;
  
  private currentUserId: number;
  private currentCategoryId: number;
  private currentFormatId: number;
  private currentFileTypeId: number;
  private currentCollectionId: number;
  private currentArtId: number;
  private currentTestimonialId: number;
  private currentFavoriteId: number;
  private currentViewId: number;
  private currentDownloadId: number;
  private currentSubscriptionId: number;
  private currentCommunityPostId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.formats = new Map();
    this.fileTypes = new Map();
    this.collections = new Map();
    this.arts = new Map();
    this.testimonials = new Map();
    this.favorites = new Map();
    this.views = new Map();
    this.downloads = new Map();
    this.subscriptions = new Map();
    this.communityPosts = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentFormatId = 1;
    this.currentFileTypeId = 1;
    this.currentCollectionId = 1;
    this.currentArtId = 1;
    this.currentTestimonialId = 1;
    this.currentFavoriteId = 1;
    this.currentViewId = 1;
    this.currentDownloadId = 1;
    this.currentSubscriptionId = 1;
    this.currentCommunityPostId = 1;
    
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
      email: "admin@designauto.com",
      name: "Administrador",
      role: "admin",
      isactive: true
    });
    
    // Criar outros usuários de exemplo para os diferentes papéis
    this.createUser({
      username: "designer",
      password: "designer123",
      email: "designer@designauto.com",
      name: "Designer",
      role: "designer",
      isactive: true
    });
    
    this.createUser({
      username: "designeradm",
      password: "designeradm123",
      email: "designeradm@designauto.com",
      name: "Designer Administrador",
      role: "designer_adm",
      isactive: true
    });
    
    this.createUser({
      username: "suporte",
      password: "suporte123",
      email: "suporte@designauto.com",
      name: "Suporte",
      role: "support",
      isactive: true
    });
    
    this.createUser({
      username: "premium",
      password: "premium123",
      email: "premium@designauto.com",
      name: "Usuário Premium",
      role: "premium",
      isactive: true
    });
    
    this.createUser({
      username: "free",
      password: "free123",
      email: "free@designauto.com",
      name: "Usuário Free",
      role: "free",
      isactive: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now,
      lastLogin: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const now = new Date();
    // Atualiza tanto role quanto nivelacesso para manter compatibilidade
    const updatedUser = { ...user, role, nivelacesso: role, updatedAt: now };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserProfile(id: number, data: { name?: string; bio?: string; profileImageUrl?: string }): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const now = new Date();
    const updatedUser = { 
      ...user, 
      ...data,
      updatedAt: now 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const now = new Date();
    const updatedUser = { 
      ...user, 
      password: newPassword,
      updatedAt: now 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserLastLogin(id: number, lastLogin: Date): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      lastLogin 
    };
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
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
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
  
  async updateFormat(id: number, format: Partial<InsertFormat>): Promise<Format | undefined> {
    const existingFormat = this.formats.get(id);
    if (!existingFormat) return undefined;
    
    const updatedFormat: Format = {
      ...existingFormat,
      ...format
    };
    
    this.formats.set(id, updatedFormat);
    return updatedFormat;
  }
  
  async deleteFormat(id: number): Promise<boolean> {
    const formatExists = this.formats.has(id);
    if (!formatExists) return false;
    
    return this.formats.delete(id);
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
  
  async updateFileType(id: number, fileType: Partial<InsertFileType>): Promise<FileType | undefined> {
    const existingFileType = this.fileTypes.get(id);
    if (!existingFileType) return undefined;
    
    const updatedFileType: FileType = {
      ...existingFileType,
      ...fileType
    };
    
    this.fileTypes.set(id, updatedFileType);
    return updatedFileType;
  }
  
  async deleteFileType(id: number): Promise<boolean> {
    const fileTypeExists = this.fileTypes.has(id);
    if (!fileTypeExists) return false;
    
    return this.fileTypes.delete(id);
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
      
      if (filters.isVisible !== undefined) {
        arts = arts.filter(art => art.isVisible === filters.isVisible);
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
  
  async getRelatedArts(artId: number, limit: number = 4): Promise<Art[]> {
    // Pega a arte de referência
    const art = this.arts.get(artId);
    if (!art) return [];
    
    // Prioriza artes da mesma categoria e mesma coleção
    const relatedArts = Array.from(this.arts.values())
      .filter(a => a.id !== artId) // Exclui a própria arte
      .sort((a, b) => {
        // Pontuação para critérios de similaridade
        const aScore = (a.categoryId === art.categoryId ? 3 : 0) + 
                       (a.collectionId === art.collectionId ? 2 : 0) + 
                       (a.format === art.format ? 1 : 0);
        
        const bScore = (b.categoryId === art.categoryId ? 3 : 0) + 
                       (b.collectionId === art.collectionId ? 2 : 0) + 
                       (b.format === art.format ? 1 : 0);
        
        return bScore - aScore; // Ordem decrescente
      })
      .slice(0, limit);
    
    return relatedArts;
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

  // Favorite methods
  async getFavoritesByUserId(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .filter(favorite => favorite.userId === userId);
  }

  async getFavorite(userId: number, artId: number): Promise<Favorite | undefined> {
    return Array.from(this.favorites.values())
      .find(favorite => favorite.userId === userId && favorite.artId === artId);
  }

  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const now = new Date().toISOString();
    const newFavorite: Favorite = {
      ...favorite,
      id,
      createdAt: now
    };
    this.favorites.set(id, newFavorite);
    return newFavorite;
  }

  async deleteFavorite(userId: number, artId: number): Promise<boolean> {
    const favorite = await this.getFavorite(userId, artId);
    if (!favorite) return false;
    
    return this.favorites.delete(favorite.id);
  }

  // View methods
  async getViewsByArtId(artId: number): Promise<View[]> {
    return Array.from(this.views.values())
      .filter(view => view.artId === artId);
  }

  async getViewsByUserId(userId: number): Promise<View[]> {
    return Array.from(this.views.values())
      .filter(view => view.userId === userId);
  }

  async createView(view: InsertView): Promise<View> {
    const id = this.currentViewId++;
    const now = new Date().toISOString();
    const newView: View = {
      ...view,
      id,
      createdAt: now
    };
    this.views.set(id, newView);
    return newView;
  }

  async getViewsCountByArtId(artId: number): Promise<number> {
    return (await this.getViewsByArtId(artId)).length;
  }
  
  // View count methods
  async recordView(view: InsertView): Promise<View> {
    const newView = await this.createView(view);
    
    // Atualiza o contador de visualizações da arte
    const art = await this.getArtById(view.artId);
    if (art) {
      const viewCount = (art.viewCount || 0) + 1;
      await this.updateArtViewCount(art.id, viewCount);
    }
    
    return newView;
  }
  
  async updateArtViewCount(artId: number, viewCount: number): Promise<boolean> {
    const art = await this.getArtById(artId);
    if (!art) return false;
    
    const now = new Date();
    const updatedArt = {
      ...art,
      viewCount,
      updatedAt: now
    };
    
    this.arts.set(artId, updatedArt);
    return true;
  }
  
  // Designer methods
  async getArtsByDesignerId(designerId: number, limit: number = 8): Promise<Art[]> {
    return Array.from(this.arts.values())
      .filter(art => art.designerId === designerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async getDesignerProfile(designerId: number): Promise<User | undefined> {
    return this.getUserById(designerId);
  }
  
  // Follow methods
  private userFollows: Map<string, UserFollow> = new Map();
  private currentUserFollowId: number = 1;
  
  async followUser(followerId: number, followingId: number): Promise<UserFollow> {
    const key = `${followerId}-${followingId}`;
    const existing = this.userFollows.get(key);
    
    if (existing) {
      return existing;
    }
    
    const id = this.currentUserFollowId++;
    const now = new Date();
    
    const follow: UserFollow = {
      id,
      followerId,
      followingId,
      createdAt: now
    };
    
    this.userFollows.set(key, follow);
    return follow;
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const key = `${followerId}-${followingId}`;
    return this.userFollows.delete(key);
  }
  
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const key = `${followerId}-${followingId}`;
    return this.userFollows.has(key);
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.userFollows.values())
      .filter(follow => follow.followingId === userId)
      .map(follow => follow.followerId);
    
    const users: User[] = [];
    for (const id of followerIds) {
      const user = await this.getUserById(id);
      if (user) users.push(user);
    }
    
    return users;
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.userFollows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    const users: User[] = [];
    for (const id of followingIds) {
      const user = await this.getUserById(id);
      if (user) users.push(user);
    }
    
    return users;
  }
  
  async getFollowerCount(userId: number): Promise<number> {
    return Array.from(this.userFollows.values())
      .filter(follow => follow.followingId === userId)
      .length;
  }
  
  async getFollowingCount(userId: number): Promise<number> {
    return Array.from(this.userFollows.values())
      .filter(follow => follow.followerId === userId)
      .length;
  }
  
  async updateFollowerCount(userId: number, count: number): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    
    // Normalmente atualizaríamos as estatísticas do usuário aqui
    return true;
  }
  
  async updateFollowingCount(userId: number, count: number): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    
    // Normalmente atualizaríamos as estatísticas do usuário aqui
    return true;
  }

  // Download methods
  async getDownloadsByUserId(userId: number): Promise<Download[]> {
    return Array.from(this.downloads.values())
      .filter(download => download.userId === userId);
  }

  async getDownloadsByArtId(artId: number): Promise<Download[]> {
    return Array.from(this.downloads.values())
      .filter(download => download.artId === artId);
  }

  async createDownload(download: InsertDownload): Promise<Download> {
    const id = this.currentDownloadId++;
    const now = new Date().toISOString();
    const newDownload: Download = {
      ...download,
      id,
      createdAt: now
    };
    this.downloads.set(id, newDownload);
    return newDownload;
  }

  async getDownloadsCountByArtId(artId: number): Promise<number> {
    return (await this.getDownloadsByArtId(artId)).length;
  }

  // Subscription methods
  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values())
      .find(subscription => subscription.userId === userId);
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const now = new Date().toISOString();
    const newSubscription: Subscription = {
      ...subscription,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }

  async updateSubscription(userId: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const subscription = await this.getSubscriptionByUserId(userId);
    if (!subscription) return undefined;
    
    const now = new Date().toISOString();
    const updatedSubscription: Subscription = {
      ...subscription,
      ...data,
      updatedAt: now
    };
    this.subscriptions.set(subscription.id, updatedSubscription);
    return updatedSubscription;
  }

  async cancelSubscription(userId: number): Promise<Subscription | undefined> {
    return this.updateSubscription(userId, { status: 'canceled' });
  }

  // Community Post methods
  async getCommunityPosts(page: number, limit: number, status?: string): Promise<{ posts: CommunityPost[], totalCount: number }> {
    let posts = Array.from(this.communityPosts.values());
    
    if (status) {
      posts = posts.filter(post => post.status === status);
    }
    
    const totalCount = posts.length;
    const paginatedPosts = posts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice((page - 1) * limit, page * limit);
    
    return { posts: paginatedPosts, totalCount };
  }

  async getCommunityPostById(id: number): Promise<CommunityPost | undefined> {
    return this.communityPosts.get(id);
  }

  async getCommunityPostsByUserId(userId: number): Promise<CommunityPost[]> {
    return Array.from(this.communityPosts.values())
      .filter(post => post.userId === userId);
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const id = this.currentCommunityPostId++;
    const now = new Date().toISOString();
    const newPost: CommunityPost = {
      ...post,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.communityPosts.set(id, newPost);
    return newPost;
  }

  async updateCommunityPostStatus(id: number, status: string): Promise<CommunityPost | undefined> {
    const post = await this.getCommunityPostById(id);
    if (!post) return undefined;
    
    const now = new Date().toISOString();
    const updatedPost: CommunityPost = {
      ...post,
      status,
      updatedAt: now
    };
    this.communityPosts.set(id, updatedPost);
    return updatedPost;
  }
}

export class DatabaseStorage implements IStorage {
  private users = schema.users;
  
  // Email verification methods
  async updateUserEmailConfirmation(userId: number, confirmed: boolean): Promise<boolean> {
    try {
      console.log(`[DatabaseStorage] Atualizando confirmação de email para o usuário ${userId} para ${confirmed}`);
      
      const result = await db
        .update(schema.users)
        .set({ 
          emailconfirmed: confirmed,
          atualizadoem: new Date() 
        })
        .where(eq(schema.users.id, userId))
        .returning();
      
      console.log(`[DatabaseStorage] Resultado da atualização de email confirmado:`, result);
      return result.length > 0;
    } catch (error) {
      console.error(`[DatabaseStorage] Erro ao atualizar confirmação de email:`, error);
      return false;
    }
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM users WHERE id = ${id}
      `);
      
      return result.rows[0] as User;
    } catch (error) {
      console.error("Erro em getUser:", error);
      return undefined;
    }
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log("DatabaseStorage.getUserByUsername buscando:", username);
      const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
      console.log("DatabaseStorage.getUserByUsername resultado:", users.length > 0 ? users[0].username : "nenhum");
      return users[0];
    } catch (error) {
      console.error("Erro em getUserByUsername:", error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM users WHERE email = ${email}
      `);
      
      return result.rows[0] as User;
    } catch (error) {
      console.error("Erro em getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: any): Promise<User> {
    try {
      // Extrair e normalizar os dados do usuário conforme o novo esquema
      const { 
        username, 
        password, 
        email, 
        name, 
        profileimageurl, 
        bio, 
        nivelacesso = "free", // Alterado para "free" como padrão
        origemassinatura, 
        tipoplano, 
        dataassinatura,
        dataexpiracao,
        acessovitalicio,
        observacaoadmin,
        isactive = true 
      } = insertUser;
      
      // Compatibilidade com código existente (mapear role -> nivelacesso)
      const role = insertUser.role;
      let nivelAcessoFinal = nivelacesso;
      
      if (role) {
        // Mapear os valores antigos para os novos
        switch (role) {
          case 'free': nivelAcessoFinal = 'free'; break;  // Mantém como "free" em vez de "usuario"
          case 'premium': nivelAcessoFinal = 'premium'; break;
          case 'admin': nivelAcessoFinal = 'admin'; break;
          case 'designer': nivelAcessoFinal = 'designer'; break;
          case 'designer_adm': nivelAcessoFinal = 'designer_adm'; break;
          case 'support': nivelAcessoFinal = 'suporte'; break;
          default: nivelAcessoFinal = 'free';  // Valor padrão é "free"
        }
      }
      
      // Mapear periodType (parametro antigo) para o novo esquema
      const periodType = insertUser.periodType;
      let tipoPlanoFinal = tipoplano || null;
      let dataExpiracaoFinal = dataexpiracao || null;
      let acessoVitalicioFinal = acessovitalicio || false;
      
      // Se for um perfil administrativo, automaticamente é vitalício
      if (['admin', 'designer', 'designer_adm', 'suporte'].includes(nivelAcessoFinal)) {
        acessoVitalicioFinal = true;
      }
      
      // Calcular data de expiração baseada no período (compatibilidade)
      const now = new Date();
      if (periodType && !dataExpiracaoFinal) {
        if (periodType === 'vitalicio') {
          acessoVitalicioFinal = true;
          tipoPlanoFinal = 'vitalicio';
        } else {
          const expDate = new Date(now);
          if (periodType === 'mensal') {
            expDate.setMonth(expDate.getMonth() + 1);
            tipoPlanoFinal = 'mensal';
          } else if (periodType === 'anual') {
            expDate.setFullYear(expDate.getFullYear() + 1);
            tipoPlanoFinal = 'anual';
          }
          dataExpiracaoFinal = expDate;
        }
      }
      
      // Execute SQL usando template literal com nomes de colunas em lowercase consistentes
      const result = await db.execute(sql`
        INSERT INTO users (
          username, 
          password, 
          email, 
          name,
          profileimageurl, 
          bio,
          nivelacesso,
          origemassinatura,
          tipoplano,
          dataassinatura,
          dataexpiracao,
          acessovitalicio,
          observacaoadmin, 
          isactive, 
          ultimologin, 
          criadoem, 
          atualizadoem,
          role
        ) 
        VALUES (
          ${username}, 
          ${password}, 
          ${email}, 
          ${name || null},
          ${profileimageurl || null}, 
          ${bio || null},
          ${nivelAcessoFinal},
          ${origemassinatura || null},
          ${tipoPlanoFinal},
          ${dataassinatura || now},
          ${dataExpiracaoFinal},
          ${acessoVitalicioFinal},
          ${observacaoadmin || null},
          ${isactive},
          ${now}, 
          ${now}, 
          ${now},
          ${role} /* Campo mantido para compatibilidade com código existente */
        ) 
        RETURNING *
      `);
      
      return result.rows[0] as User;
    } catch (error) {
      console.error("Erro em createUser:", error);
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    try {
      const now = new Date();
      
      // Construir dinamicamente as partes do SQL para campos atualizáveis
      const sets: string[] = [];
      const values: any[] = [];
      
      // Lista de campos que podem ser atualizados
      const allowedFields: (keyof User)[] = ['name', 'bio', 'profileimageurl', 'website', 'location'];
      
      // Remover o campo 'id' se estiver presente
      delete data.id;
      
      // Adicionar cada campo presente no objeto data
      for (const key of allowedFields) {
        if (data[key] !== undefined) {
          sets.push(`${key} = $${sets.length + 1}`);
          values.push(data[key]);
        }
      }
      
      // Adicionar a data de atualização
      sets.push(`atualizadoem = $${sets.length + 1}`);
      values.push(now);
      
      // Se não houver campos para atualizar, retorne o usuário atual
      if (sets.length === 0) {
        const user = await this.getUser(id);
        return user;
      }
      
      // Adicionar o ID como último parâmetro para a cláusula WHERE
      values.push(id);
      
      // Construir a query SQL
      const query = `
        UPDATE users 
        SET ${sets.join(', ')} 
        WHERE id = $${values.length}
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query, ...values));
      
      return result.rows[0] as User;
    } catch (error) {
      console.error("Erro em updateUser:", error);
      return undefined;
    }
  }
  
  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    try {
      const now = new Date();
      const result = await db.execute(sql`
        UPDATE users 
        SET role = ${role}, nivelacesso = ${role}, updatedat = ${now}
        WHERE id = ${id}
        RETURNING *
      `);
      
      return result.rows[0] as User;
    } catch (error) {
      console.error("Erro em updateUserRole:", error);
      return undefined;
    }
  }
  
  async updateUserProfile(id: number, data: { name?: string; bio?: string; profileImageUrl?: string }): Promise<User | undefined> {
    try {
      const now = new Date();
      const name = data.name !== undefined ? data.name : null;
      const bio = data.bio !== undefined ? data.bio : null;
      
      if (data.profileImageUrl !== undefined) {
        const result = await db.execute(sql`
          UPDATE users 
          SET name = ${name}, bio = ${bio}, profileimageurl = ${data.profileImageUrl}, updatedat = ${now}
          WHERE id = ${id}
          RETURNING *
        `);
        
        return result.rows[0] as User;
      } else {
        // Se profileImageUrl não foi fornecido, fazemos um update sem ele
        const result = await db.execute(sql`
          UPDATE users 
          SET name = ${name}, bio = ${bio}, updatedat = ${now}
          WHERE id = ${id}
          RETURNING *
        `);
        
        return result.rows[0] as User;
      }
    } catch (error) {
      console.error("Erro em updateUserProfile:", error);
      return undefined;
    }
  }
  
  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    try {
      const now = new Date();
      const result = await db.execute(sql`
        UPDATE users 
        SET password = ${newPassword}, updatedat = ${now}
        WHERE id = ${id}
        RETURNING *
      `);
      
      return result.rows[0] as User;
    } catch (error) {
      console.error("Erro em updateUserPassword:", error);
      return undefined;
    }
  }
  
  async updateUserLastLogin(id: number, lastLogin: Date): Promise<User | undefined> {
    try {
      // Usar SQL bruto para garantir que está atualizando as colunas corretas
      const result = await db.execute(sql`
        UPDATE users 
        SET lastlogin = ${lastLogin}, ultimologin = ${lastLogin}
        WHERE id = ${id}
        RETURNING *
      `);
      
      console.log("Usuário atualizado com último login:", result.rows[0]);
      return result.rows[0] as User;
    } catch (error) {
      console.error("Erro em updateUserLastLogin:", error);
      return undefined;
    }
  }
  
  async updateUserSupabaseId(userId: number, supabaseId: string | null): Promise<User> {
    try {
      const now = new Date();
      const result = await db.execute(sql`
        UPDATE users 
        SET supabaseId = ${supabaseId}, atualizadoem = ${now}
        WHERE id = ${userId}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        throw new Error(`Usuário com ID ${userId} não encontrado`);
      }
      
      console.log("Usuário atualizado com Supabase ID:", result.rows[0]);
      return result.rows[0] as User;
    } catch (error) {
      console.error("Erro em updateUserSupabaseId:", error);
      throw error;
    }
  }
  
  async updateUserEmailConfirmed(userId: number, confirmed: boolean): Promise<User> {
    try {
      const now = new Date();
      const result = await db.execute(sql`
        UPDATE users 
        SET emailconfirmed = ${confirmed}, atualizadoem = ${now}
        WHERE id = ${userId}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        throw new Error(`Usuário com ID ${userId} não encontrado`);
      }
      
      console.log("Status de confirmação de email atualizado:", result.rows[0]);
      return result.rows[0] as User;
    } catch (error) {
      console.error("Erro em updateUserEmailConfirmed:", error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Antes de excluir o usuário, vamos verificar se ele existe
      const user = await this.getUser(id);
      if (!user) return false;

      // Excluir o usuário
      const result = await db.execute(sql`
        DELETE FROM users
        WHERE id = ${id}
      `);

      // Se a consulta afetou pelo menos uma linha, a exclusão foi bem-sucedida
      return result.rowCount > 0;
    } catch (error) {
      console.error("Erro em deleteUser:", error);
      return false;
    }
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const now = new Date();
    const [updatedCategory] = await db
      .update(categories)
      .set({ 
        ...categoryData,
        updatedAt: now 
      })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));
      
    return !!result.rowCount;
  }
  
  // Format methods
  async getFormats(): Promise<Format[]> {
    return db.select().from(formats);
  }
  
  async getFormatById(id: number): Promise<Format | undefined> {
    const [format] = await db.select().from(formats).where(eq(formats.id, id));
    return format;
  }
  
  async createFormat(format: InsertFormat): Promise<Format> {
    const [newFormat] = await db.insert(formats).values(format).returning();
    return newFormat;
  }
  
  async updateFormat(id: number, formatData: Partial<InsertFormat>): Promise<Format | undefined> {
    try {
      const [updatedFormat] = await db
        .update(formats)
        .set(formatData)
        .where(eq(formats.id, id))
        .returning();
      return updatedFormat;
    } catch (error) {
      console.error("Erro ao atualizar formato:", error);
      return undefined;
    }
  }
  
  async deleteFormat(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(formats)
        .where(eq(formats.id, id));
        
      return !!result.rowCount;
    } catch (error) {
      console.error("Erro ao excluir formato:", error);
      return false;
    }
  }
  
  // File type methods
  async getFileTypes(): Promise<FileType[]> {
    return db.select().from(fileTypes);
  }
  
  async getFileTypeById(id: number): Promise<FileType | undefined> {
    const [fileType] = await db.select().from(fileTypes).where(eq(fileTypes.id, id));
    return fileType;
  }
  
  async createFileType(fileType: InsertFileType): Promise<FileType> {
    const [newFileType] = await db.insert(fileTypes).values(fileType).returning();
    return newFileType;
  }
  
  async updateFileType(id: number, fileTypeData: Partial<InsertFileType>): Promise<FileType | undefined> {
    try {
      const [updatedFileType] = await db
        .update(fileTypes)
        .set(fileTypeData)
        .where(eq(fileTypes.id, id))
        .returning();
      return updatedFileType;
    } catch (error) {
      console.error("Erro ao atualizar tipo de arquivo:", error);
      return undefined;
    }
  }
  
  async deleteFileType(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(fileTypes)
        .where(eq(fileTypes.id, id));
        
      return !!result.rowCount;
    } catch (error) {
      console.error("Erro ao excluir tipo de arquivo:", error);
      return false;
    }
  }
  
  // Collection methods
  async getCollections(page: number, limit: number, search?: string): Promise<{ collections: Collection[], totalCount: number }> {
    let query = db.select().from(collections);
    
    if (search) {
      query = query.where(
        or(
          like(collections.title, `%${search}%`),
          like(collections.description, `%${search}%`)
        )
      );
    }
    
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(collections);
    
    if (search) {
      countQuery.where(
        or(
          like(collections.title, `%${search}%`),
          like(collections.description, `%${search}%`)
        )
      );
    }
    
    const offset = (page - 1) * limit;
    const collectionsResult = await query
      .orderBy(desc(collections.updatedAt))
      .limit(limit)
      .offset(offset);
      
    const [{ count }] = await countQuery;
    
    return { 
      collections: collectionsResult,
      totalCount: count
    };
  }
  
  async getFeaturedCollections(limit = 4): Promise<Collection[]> {
    return db
      .select()
      .from(collections)
      .orderBy(desc(collections.updatedAt))
      .limit(limit);
  }
  
  async getCollectionById(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection;
  }
  
  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db.insert(collections).values(collection).returning();
    return newCollection;
  }
  
  // Art methods
  async getArts(page: number, limit: number, filters?: ArtFilters): Promise<{ arts: Art[], totalCount: number }> {
    try {
      // Abordagem utilizando sql.raw() para consultas SQL diretas
      const offset = (page - 1) * limit;
      
      // Construir a consulta base sem WHERE
      const baseQuery = `
        SELECT 
          id, 
          "createdAt", 
          "updatedAt", 
          designerid, 
          viewcount,
          width, 
          height, 
          "isPremium",
          "isVisible",
          "categoryId", 
          "collectionId", 
          title, 
          "imageUrl", 
          format, 
          "fileType", 
          "editUrl", 
          aspectratio
        FROM arts
      `;
      
      // Construir consulta usando a funcionalidade correta do Drizzle
      let query = sql`${sql.raw(baseQuery)}`;
      
      // Adicionar filtros se existirem
      if (filters) {
        let hasWhere = false;
        
        if (filters.categoryId) {
          query = sql`${query} WHERE "categoryId" = ${filters.categoryId}`;
          hasWhere = true;
        }
        
        if (filters.search) {
          const searchTerm = `%${filters.search}%`;
          if (hasWhere) {
            query = sql`${query} AND title ILIKE ${searchTerm}`;
          } else {
            query = sql`${query} WHERE title ILIKE ${searchTerm}`;
            hasWhere = true;
          }
        }
        
        if (filters.isPremium !== undefined) {
          const condition = filters.isPremium ? 'TRUE' : 'FALSE';
          if (hasWhere) {
            query = sql`${query} AND "isPremium" = ${sql.raw(condition)}`;
          } else {
            query = sql`${query} WHERE "isPremium" = ${sql.raw(condition)}`;
            hasWhere = true;
          }
        }
        
        if (filters.isVisible !== undefined) {
          const condition = filters.isVisible ? 'TRUE' : 'FALSE';
          if (hasWhere) {
            query = sql`${query} AND "isVisible" = ${sql.raw(condition)}`;
          } else {
            query = sql`${query} WHERE "isVisible" = ${sql.raw(condition)}`;
            hasWhere = true;
          }
        }
      }
      
      // Adicionar ordenação baseada no parâmetro sortBy e limite
      if (filters?.sortBy === 'recent') {
        query = sql`${query} ORDER BY "createdAt" DESC`;
      } else if (filters?.sortBy === 'popular') {
        query = sql`${query} ORDER BY "viewcount" DESC, "createdAt" DESC`;
      } else {
        // Ordenação padrão por data de criação
        query = sql`${query} ORDER BY "createdAt" DESC`;
      }
      
      // Adicionar limite e offset (paginação)
      query = sql`${query} LIMIT ${limit} OFFSET ${offset}`;
      
      // Executar a consulta
      const result = await db.execute(query);
      
      // Consulta para obter o total de registros
      let countQuery = sql`SELECT COUNT(*) as count FROM arts`;
      
      if (filters) {
        let hasWhere = false;
        
        if (filters.categoryId) {
          countQuery = sql`${countQuery} WHERE "categoryId" = ${filters.categoryId}`;
          hasWhere = true;
        }
        
        if (filters.search) {
          const searchTerm = `%${filters.search}%`;
          if (hasWhere) {
            countQuery = sql`${countQuery} AND title ILIKE ${searchTerm}`;
          } else {
            countQuery = sql`${countQuery} WHERE title ILIKE ${searchTerm}`;
            hasWhere = true;
          }
        }
        
        if (filters.isPremium !== undefined) {
          const condition = filters.isPremium ? 'TRUE' : 'FALSE';
          if (hasWhere) {
            countQuery = sql`${countQuery} AND "isPremium" = ${sql.raw(condition)}`;
          } else {
            countQuery = sql`${countQuery} WHERE "isPremium" = ${sql.raw(condition)}`;
            hasWhere = true;
          }
        }
        
        if (filters.isVisible !== undefined) {
          const condition = filters.isVisible ? 'TRUE' : 'FALSE';
          if (hasWhere) {
            countQuery = sql`${countQuery} AND "isVisible" = ${sql.raw(condition)}`;
          } else {
            countQuery = sql`${countQuery} WHERE "isVisible" = ${sql.raw(condition)}`;
            hasWhere = true;
          }
        }
      }
      
      const countResult = await db.execute(countQuery);
      
      // Mapear os resultados para o tipo Art com nomes em camelCase
      const arts = result.rows.map(row => ({
        ...row,
        designerId: row.designerid,
        viewCount: row.viewcount,
        aspectRatio: row.aspectratio
      }));
      
      return {
        arts: arts as Art[],
        totalCount: parseInt(countResult.rows[0].count as string)
      };
    } catch (error) {
      console.error("Erro em getArts:", error);
      throw error;
    }
  }
  
  async getArtById(id: number): Promise<Art | undefined> {
    try {
      // Usar SQL bruto para evitar problemas com nomes de colunas
      // Incluir JOIN com categorias para obter dados da categoria diretamente
      const result = await db.execute(sql`
        SELECT 
          a.id, 
          a."createdAt", 
          a."updatedAt", 
          a.designerid, 
          a.viewcount,
          a.width, 
          a.height, 
          a."isPremium",
          a."isVisible", 
          a."categoryId", 
          a."collectionId", 
          a.title, 
          a."imageUrl", 
          a.format, 
          a."fileType", 
          a."editUrl", 
          a.aspectratio,
          c.id as "category_id",
          c.name as "category_name",
          c.slug as "category_slug"
        FROM arts a
        LEFT JOIN categories c ON a."categoryId" = c.id
        WHERE a.id = ${id}
      `);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Mapear colunas minúsculas para camelCase
      const row = result.rows[0];
      
      // Criar objeto categoria se existir
      const category = row.category_id ? {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug
      } : null;
      
      // Criar objeto arte com categoria embutida
      const art = {
        ...row,
        designerId: row.designerid,
        viewCount: row.viewcount,
        aspectRatio: row.aspectratio,
        category: category
      } as Art;
      
      return art;
    } catch (error) {
      console.error("Erro em getArtById:", error);
      throw error;
    }
  }
  
  async getArtsByCollectionId(collectionId: number): Promise<Art[]> {
    return db.select().from(arts).where(eq(arts.collectionId, collectionId));
  }
  
  async getRelatedArts(artId: number, limit: number = 4): Promise<Art[]> {
    try {
      // Primeiro obtém a arte de referência com sua categoria
      const result = await db.execute(sql`
        SELECT 
          a.id, 
          a."createdAt", 
          a."updatedAt", 
          a.designerid, 
          a.viewcount,
          a.width, 
          a.height, 
          a."isPremium",
          a."isVisible", 
          a."categoryId", 
          a."collectionId", 
          a.title, 
          a."imageUrl", 
          a.format, 
          a."fileType", 
          a."editUrl", 
          a.aspectratio,
          c.id as "category_id",
          c.name as "category_name",
          c.slug as "category_slug"
        FROM arts a
        LEFT JOIN categories c ON a."categoryId" = c.id
        WHERE a.id = ${artId}
      `);
      
      if (result.rows.length === 0) return [];
      const artRow = result.rows[0];
      
      // Extrai palavras-chave do título da arte de referência
      // Converte para minúsculas, remove caracteres especiais e dividi em palavras
      const titleKeywords = artRow.title
        .toLowerCase()
        .replace(/[^\w\sÀ-ÿ]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3) // Apenas palavras com mais de 3 caracteres
        .filter(word => !['para', 'com', 'que', 'das', 'dos', 'por', 'uma', 'nas', 'nos', 'loja'].includes(word)); // Remove palavras comuns
      
      console.log(`[getRelatedArts] Palavras-chave extraídas do título "${artRow.title}":`, titleKeywords);
      
      // Busca todas as artes exceto a atual, incluindo suas categorias
      const artsResult = await db.execute(sql`
        SELECT 
          a.id, 
          a."createdAt", 
          a."updatedAt", 
          a.designerid, 
          a.viewcount,
          a.width, 
          a.height, 
          a."isPremium",
          a."isVisible", 
          a."categoryId", 
          a."collectionId", 
          a.title, 
          a."imageUrl", 
          a.format, 
          a."fileType", 
          a."editUrl", 
          a.aspectratio,
          c.id as "category_id",
          c.name as "category_name",
          c.slug as "category_slug"
        FROM arts a
        LEFT JOIN categories c ON a."categoryId" = c.id
        WHERE a.id != ${artId} AND a."isVisible" = true
        ORDER BY a."createdAt" DESC
      `);
      
      const allArts = artsResult.rows;
      
      // Calcula a pontuação de relevância para cada arte com base na similaridade
      const scoredArts = allArts.map(a => {
        // Atribui pontuação baseada em diferentes critérios de similaridade
        let score = 0;
        
        // Mesma categoria (peso importante)
        if (a.categoryId === artRow.categoryId) score += 5;
        
        // Correspondência de palavras-chave do título (maior peso)
        const artTitleLower = a.title.toLowerCase();
        const keywordMatches = titleKeywords.filter(keyword => 
          artTitleLower.includes(keyword)
        ).length;
        
        // Adicionar pontuação baseada na quantidade de palavras-chave correspondentes
        score += keywordMatches * 7; // Dá mais peso às correspondências de palavras-chave
        
        // Mesma coleção (peso médio)
        if (a.collectionId === artRow.collectionId) score += 3;
        
        // Mesmo formato (peso menor)
        if (a.format === artRow.format) score += 2;
        
        // Mesmo designer (menor peso, mas ainda considerado)
        if (a.designerid === artRow.designerid) score += 1;
        
        // Criar objeto arte com categoria embutida
        const category = a.category_id ? {
          id: a.category_id,
          name: a.category_name,
          slug: a.category_slug
        } : null;
        
        const mappedArt = {
          ...a,
          designerId: a.designerid,
          viewCount: a.viewcount,
          aspectRatio: a.aspectratio,
          category: category
        } as Art;
        
        return { 
          art: mappedArt, 
          score,
          keywordMatches, // Para debug
          title: a.title // Para debug
        };
      });
      
      // Log para debug mostrando as correspondências de palavras-chave
      console.log("[getRelatedArts] Análise de correspondência de palavras-chave:");
      scoredArts.slice(0, 10).forEach(item => {
        console.log(`- Arte "${item.title}" (ID ${item.art.id}): Score ${item.score}, ${item.keywordMatches} palavras-chave correspondentes`);
      });
      
      // Ordena por pontuação (maior para menor)
      let sortedArts = scoredArts.sort((a, b) => b.score - a.score);
      
      // Obtém artes por correspondência de palavras-chave
      let relatedArts = sortedArts.slice(0, limit).map(item => item.art);
      
      // Se não tiver suficientes artes relacionadas, fazemos o preenchimento com outras estratégias
      if (relatedArts.length < limit) {
        console.log(`[getRelatedArts] Artes por palavras-chave insuficientes (${relatedArts.length}/${limit}). Buscando alternativas.`);
        
        // Filtrar artes que já estão incluídas
        const relatedArtIds = new Set(relatedArts.map(art => art.id));
        
        // ESTRATÉGIA 1: Obter artes da mesma categoria que ainda não estão incluídas
        let additionalArts = [];
        
        if (artRow.categoryId) {
          console.log(`[getRelatedArts] Tentando encontrar artes da mesma categoria (ID: ${artRow.categoryId}).`);
          
          const sameCategoryArts = allArts
            .filter(a => 
              a.categoryId === artRow.categoryId && // Mesma categoria
              !relatedArtIds.has(a.id) // Não incluída ainda
            )
            .map(a => {
              // Criar objeto arte com categoria embutida
              const category = a.category_id ? {
                id: a.category_id,
                name: a.category_name,
                slug: a.category_slug
              } : null;
              
              return {
                ...a,
                designerId: a.designerid,
                viewCount: a.viewcount,
                aspectRatio: a.aspectratio,
                category: category
              } as Art;
            });
          
          console.log(`[getRelatedArts] Encontradas ${sameCategoryArts.length} artes adicionais da mesma categoria.`);
          additionalArts = sameCategoryArts;
        }
        
        // ESTRATÉGIA 2: Se ainda não tiver suficientes, adiciona artes mais recentes
        if (relatedArts.length + additionalArts.length < limit) {
          console.log(`[getRelatedArts] Ainda insuficiente (${relatedArts.length + additionalArts.length}/${limit}). Adicionando artes recentes.`);
          
          // União dos IDs já incluídos
          const allIncludedIds = new Set([
            ...relatedArtIds,
            ...additionalArts.map(art => art.id)
          ]);
          
          // Pegar artes mais recentes que ainda não foram incluídas
          const recentArts = allArts
            .filter(a => !allIncludedIds.has(a.id))
            .sort((a, b) => {
              // Ordenar por data de criação mais recente
              const dateA = new Date(a.createdAt as string).getTime();
              const dateB = new Date(b.createdAt as string).getTime();
              return dateB - dateA;
            })
            .slice(0, limit - (relatedArts.length + additionalArts.length))
            .map(a => {
              // Criar objeto arte com categoria embutida
              const category = a.category_id ? {
                id: a.category_id,
                name: a.category_name,
                slug: a.category_slug
              } : null;
              
              return {
                ...a,
                designerId: a.designerid,
                viewCount: a.viewcount,
                aspectRatio: a.aspectratio,
                category: category
              } as Art;
            });
          
          console.log(`[getRelatedArts] Encontradas ${recentArts.length} artes recentes para completar.`);
          
          // Adicionar às artes adicionais
          additionalArts = [...additionalArts, ...recentArts];
        }
        
        // Combinar artes, limitando ao número máximo
        relatedArts = [...relatedArts, ...additionalArts].slice(0, limit);
        console.log(`[getRelatedArts] Total final de artes relacionadas: ${relatedArts.length}/${limit}`);
      }
      
      return relatedArts;
    } catch (error) {
      console.error("Erro em getRelatedArts:", error);
      return [];
    }
  }
  
  async createArt(art: InsertArt): Promise<Art> {
    try {
      // Adicionar logs para depuração
      console.log(`[createArt] Criando arte com groupId: ${art.groupId}`);
      
      // Mapeando os nomes das propriedades para os nomes corretos das colunas
      const artData: any = { ...art };
      
      // Se tiver designerId, precisamos renomear para designerid
      if (artData.designerId !== undefined) {
        artData.designerid = artData.designerId;
        delete artData.designerId;
      }
      
      // Se tiver viewCount, precisamos renomear para viewcount
      if (artData.viewCount !== undefined) {
        artData.viewcount = artData.viewCount;
        delete artData.viewCount;
      }
      
      // Se tiver aspectRatio, precisamos renomear para aspectratio
      if (artData.aspectRatio !== undefined) {
        artData.aspectratio = artData.aspectRatio;
        delete artData.aspectRatio;
      }
      
      // Certificar que groupId está sendo passado corretamente
      console.log(`[createArt] Dados da arte antes da inserção:`, {
        title: artData.title,
        format: artData.format,
        groupId: artData.groupId
      });
      
      const [newArt] = await db.insert(arts).values(artData).returning();
      
      // Log para verificar o resultado da inserção
      console.log(`[createArt] Arte criada com ID ${newArt.id}, groupId: ${newArt.groupId}`);
      
      // Garantir que o objeto retornado tenha as propriedades em camelCase
      const result = {
        ...newArt,
        designerId: newArt.designerid,
        viewCount: newArt.viewcount,
        aspectRatio: newArt.aspectratio
      };
      
      // Remover as propriedades em lowercase
      delete result.designerid;
      delete result.viewcount;
      delete result.aspectratio;
      
      return result as Art;
    } catch (error) {
      console.error("Erro ao criar arte:", error);
      throw error;
    }
  }
  
  async updateArt(id: number, art: Partial<InsertArt>): Promise<Art | undefined> {
    try {
      // Se estiver atualizando a visibilidade, usar SQL direto para garantir
      // que o nome da coluna seja exatamente o mesmo do banco de dados
      if (art.isVisible !== undefined) {
        console.log(`[updateArt] Atualizando visibilidade da arte ${id} para ${art.isVisible}`);
        
        // Usar SQL bruto para ter certeza que o nome da coluna está correto
        const result = await db.execute(sql`
          UPDATE arts 
          SET "isVisible" = ${art.isVisible}, "updatedAt" = NOW()
          WHERE id = ${id}
          RETURNING *
        `);
        
        if (result.rowCount === 0) {
          console.log(`[updateArt] Nenhuma arte encontrada com ID ${id}`);
          return undefined;
        }
        
        // Retornar a primeira linha (a arte atualizada)
        const updatedArt = result.rows[0];
        console.log(`[updateArt] Arte atualizada:`, { 
          id: updatedArt.id, 
          title: updatedArt.title, 
          isVisible: updatedArt.isVisible 
        });
        
        return updatedArt as Art;
      } else {
        // Para outras atualizações, usar o método normal do Drizzle
        const [updatedArt] = await db
          .update(arts)
          .set(art)
          .where(eq(arts.id, id))
          .returning();
        return updatedArt;
      }
    } catch (error) {
      console.error(`[updateArt] Erro ao atualizar arte ${id}:`, error);
      throw error;
    }
  }
  
  async deleteArt(id: number): Promise<boolean> {
    const result = await db
      .delete(arts)
      .where(eq(arts.id, id));
    return result.rowCount > 0;
  }
  
  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials);
  }
  
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [newTestimonial] = await db.insert(testimonials).values(testimonial).returning();
    return newTestimonial;
  }

  // Favorite methods
  async getFavoritesByUserId(userId: number): Promise<Favorite[]> {
    return db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async getFavorite(userId: number, artId: number): Promise<Favorite | undefined> {
    const [favorite] = await db.select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.artId, artId)
      ));
    return favorite;
  }

  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async deleteFavorite(userId: number, artId: number): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.artId, artId)
      ));
    return result.rowCount > 0;
  }

  // View methods
  async getViewsByArtId(artId: number): Promise<View[]> {
    return db.select().from(views).where(eq(views.artId, artId));
  }

  async getViewsByUserId(userId: number): Promise<View[]> {
    return db.select().from(views).where(eq(views.userId, userId));
  }

  async createView(view: InsertView): Promise<View> {
    const [newView] = await db.insert(views).values(view).returning();
    return newView;
  }

  async getViewsCountByArtId(artId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(views)
      .where(eq(views.artId, artId));
    return result[0]?.count || 0;
  }
  
  // View count methods
  async recordView(view: InsertView): Promise<View> {
    // Criar a visualização
    const newView = await this.createView(view);
    
    // Atualizar o contador de visualizações da arte
    const art = await this.getArtById(view.artId);
    if (art) {
      // art já está mapeado para ter a propriedade viewCount em getArtById
      const viewCount = (art.viewCount || 0) + 1;
      await this.updateArtViewCount(art.id, viewCount);
    }
    
    return newView;
  }
  
  async updateArtViewCount(artId: number, viewCount: number): Promise<boolean> {
    try {
      // Usar SQL bruto com nomes corretos de colunas
      const now = new Date();
      const result = await db.execute(sql`
        UPDATE arts 
        SET viewcount = ${viewCount}, "updatedAt" = ${now}
        WHERE id = ${artId}
      `);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Erro em updateArtViewCount:", error);
      return false;
    }
  }
  
  // Designer Stats methods
  async getDesignerStats(userId: number): Promise<{ followers: number; totalArts: number; } | undefined> {
    try {
      // Buscar contagem de seguidores
      const followersResult = await db.execute(sql`
        SELECT COUNT(*) as value 
        FROM "userFollows"
        WHERE "followingId" = ${userId}
      `);
      
      const followers = parseInt(followersResult.rows[0].value.toString()) || 0;
      
      // Buscar contagem de artes
      const artsResult = await db.execute(sql`
        SELECT COUNT(*) as value 
        FROM arts
        WHERE designerid = ${userId}
      `);
      
      const totalArts = parseInt(artsResult.rows[0].value.toString()) || 0;
      
      return { followers, totalArts };
    } catch (error) {
      console.error("Erro ao buscar estatísticas do designer:", error);
      return { followers: 0, totalArts: 0 };
    }
  }

  async getDesignerStatsByArtId(userId: number, artId: number): Promise<DesignerStat | undefined> {
    try {
      const [designerStat] = await db
        .select()
        .from(designerStats)
        .where(and(
          eq(designerStats.designerId, userId),
          eq(designerStats.artId, artId)
        ));
        
      return designerStat;
    } catch (error) {
      console.error("Erro ao buscar estatísticas do designer para arte:", error);
      return undefined;
    }
  }
  
  // Designer methods
  async getArtsByDesignerId(designerId: number, limit: number = 8): Promise<Art[]> {
    try {
      // Usar SQL bruto para evitar problemas com nomes de colunas
      const result = await db.execute(sql`
        SELECT 
          id, 
          "createdAt", 
          "updatedAt", 
          designerid, 
          viewcount,
          width, 
          height, 
          "isPremium",
          "isVisible", 
          "categoryId", 
          "collectionId", 
          title, 
          "imageUrl", 
          format, 
          "fileType", 
          "editUrl", 
          aspectratio
        FROM arts 
        WHERE designerid = ${designerId}
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `);
      
      // Mapear as colunas para o formato esperado
      const arts = result.rows.map(art => ({
        ...art,
        designerId: art.designerid,
        viewCount: art.viewcount,
        aspectRatio: art.aspectratio
      }));
      
      return arts as Art[];
    } catch (error) {
      console.error("Erro em getArtsByDesignerId:", error);
      throw error;
    }
  }
  
  async getDesignerProfile(designerId: number): Promise<User | undefined> {
    return this.getUserById(designerId);
  }
  
  // Follow methods
  async followUser(followerId: number, followingId: number): Promise<UserFollow> {
    const [follow] = await db.insert(userFollows)
      .values({
        followerId,
        followingId
      })
      .onConflictDoNothing()
      .returning();
    
    // Se já existia e não foi inserido, buscar o existente
    if (!follow) {
      const [existingFollow] = await db.select()
        .from(userFollows)
        .where(and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        ));
      
      return existingFollow;
    }
    
    return follow;
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const result = await db.delete(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ));
    
    return result.rowCount > 0;
  }
  
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await db.select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ));
    
    return !!follow;
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    // Busca todos os usuários que seguem o usuário (userId)
    const followers = await db.select({
        followerId: userFollows.followerId
      })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));
    
    // Para cada id de seguidor, busca o usuário completo
    const users: User[] = [];
    for (const { followerId } of followers) {
      const user = await this.getUserById(followerId);
      if (user) users.push(user);
    }
    
    return users;
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    // Busca todos os usuários que o usuário (userId) segue
    const following = await db.select({
        followingId: userFollows.followingId
      })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    
    // Para cada id de seguido, busca o usuário completo
    const users: User[] = [];
    for (const { followingId } of following) {
      const user = await this.getUserById(followingId);
      if (user) users.push(user);
    }
    
    return users;
  }
  
  async getFollowerCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));
    
    return result[0]?.count || 0;
  }
  
  async getFollowingCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    
    return result[0]?.count || 0;
  }
  
  async updateFollowerCount(userId: number, count: number): Promise<boolean> {
    // Esta função seria utilizada para atualizar estatísticas do usuário em uma tabela específica
    // Por enquanto, vamos apenas retornar true
    return true;
  }
  
  async updateFollowingCount(userId: number, count: number): Promise<boolean> {
    // Esta função seria utilizada para atualizar estatísticas do usuário em uma tabela específica
    // Por enquanto, vamos apenas retornar true
    return true;
  }
  
  // Obtém artes recentes dos designers que o usuário segue
  async getFollowingDesignersArts(userId: number, limit: number = 12): Promise<Art[]> {
    try {
      // Busca os IDs dos designers que o usuário segue
      const followings = await db.select({
        followingId: userFollows.followingId
      })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
      
      if (followings.length === 0) {
        return [];
      }
      
      // Extrai os IDs dos designers seguidos
      const designerIds = followings.map(f => f.followingId);
      
      // Busca as artes mais recentes desses designers
      const result = await db.execute(sql`
        SELECT 
          a.id, 
          a."createdAt", 
          a."updatedAt", 
          a.designerid, 
          a.viewcount,
          a.width, 
          a.height, 
          a."isPremium",
          a."isVisible", 
          a."categoryId", 
          a."collectionId", 
          a.title, 
          a."imageUrl", 
          a.format, 
          a."fileType", 
          a."editUrl", 
          a.aspectratio,
          u.username AS designer_username,
          u.name AS designer_name,
          u.profileimageurl AS designer_avatar
        FROM arts a
        JOIN users u ON a.designerid = u.id
        WHERE a.designerid IN (${sql.join(designerIds, sql`,`)})
          AND a."isVisible" = TRUE
        ORDER BY a."createdAt" DESC
        LIMIT ${limit}
      `);
      
      // Mapear as colunas para o formato esperado, incluindo informações do designer
      const arts = result.rows.map(art => ({
        ...art,
        designerId: art.designerid,
        viewCount: art.viewcount,
        aspectRatio: art.aspectratio,
        designer: {
          id: art.designerid,
          username: art.designer_username,
          name: art.designer_name,
          profileimageurl: art.designer_avatar
        }
      }));
      
      return arts as Art[];
    } catch (error) {
      console.error("Erro em getFollowingDesignersArts:", error);
      return [];
    }
  }

  // Download methods
  async getDownloadsByUserId(userId: number): Promise<Download[]> {
    return db.select().from(downloads).where(eq(downloads.userId, userId));
  }

  async getDownloadsByArtId(artId: number): Promise<Download[]> {
    return db.select().from(downloads).where(eq(downloads.artId, artId));
  }

  async createDownload(download: InsertDownload): Promise<Download> {
    const [newDownload] = await db.insert(downloads).values(download).returning();
    return newDownload;
  }

  async getDownloadsCountByArtId(artId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(downloads)
      .where(eq(downloads.artId, artId));
    return result[0]?.count || 0;
  }

  // Subscription methods
  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateSubscription(userId: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db.update(subscriptions)
      .set(data)
      .where(eq(subscriptions.userId, userId))
      .returning();
    return updatedSubscription;
  }

  async cancelSubscription(userId: number): Promise<Subscription | undefined> {
    const now = new Date();
    const [updatedSubscription] = await db.update(subscriptions)
      .set({ 
        status: 'canceled',
        updatedAt: now
      })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return updatedSubscription;
  }

  // Community Post methods
  async getCommunityPosts(page: number, limit: number, status?: string): Promise<{ posts: CommunityPost[], totalCount: number }> {
    let query = db.select().from(communityPosts);
    
    if (status) {
      query = query.where(eq(communityPosts.status, status));
    }
    
    const posts = await query
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(communityPosts);
    if (status) {
      countQuery.where(eq(communityPosts.status, status));
    }
    
    const result = await countQuery;
    const totalCount = result[0]?.count || 0;
    
    return { posts, totalCount };
  }

  async getCommunityPostById(id: number): Promise<CommunityPost | undefined> {
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    return post;
  }

  async getCommunityPostsByUserId(userId: number): Promise<CommunityPost[]> {
    return db.select().from(communityPosts).where(eq(communityPosts.userId, userId));
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [newPost] = await db.insert(communityPosts).values(post).returning();
    return newPost;
  }

  async updateCommunityPostStatus(id: number, status: string): Promise<CommunityPost | undefined> {
    const now = new Date();
    const [updatedPost] = await db.update(communityPosts)
      .set({ 
        status,
        updatedAt: now
      })
      .where(eq(communityPosts.id, id))
      .returning();
    return updatedPost;
  }
}

// Inicialização do armazenamento
export const storage = new DatabaseStorage();
