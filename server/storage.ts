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
  Report,
  InsertReport,
  ReportType,
  InsertReportType,
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
import { eq, like, desc, and, or, isNull, sql, count } from "drizzle-orm";
import { 
  reports, 
  reportTypes 
} from "../shared/schema";

export interface IStorage {
  // Métodos SEO
  getAllArtsForSitemap(): Promise<Art[]>;
  getArtBySlug(slug: string): Promise<Art | undefined>;
  getArtsByCategorySlug(categorySlug: string, page?: number, limit?: number): Promise<{ arts: Art[]; totalCount: number }>;
  
  // Art methods
  getArt(id: number): Promise<Art | undefined>;
  
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
  
  // Report methods
  getReportTypes(): Promise<ReportType[]>;
  getReportById(id: number): Promise<Report | undefined>;
  getReports(options: { page: number, limit: number, status?: string | null }): Promise<Report[]>;
  getReportsCount(status?: string | null): Promise<number>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, data: Partial<Report>): Promise<Report | undefined>;
  
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
  
  // Report methods
  getReportTypes(): Promise<ReportType[]>;
  getReports(options: { page: number; limit: number; status?: string | null }): Promise<Report[]>;
  getReportsCount(status?: string | null): Promise<number>;
  getReportById(id: number): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined>;

  // Webhook logs methods
  getWebhookLogs(page: number, limit: number, filters?: {
    status?: string;
    eventType?: string;
    search?: string;
  }): Promise<{ logs: schema.WebhookLog[], totalCount: number }>;
  getWebhookLogById(id: number): Promise<schema.WebhookLog | undefined>;
  createWebhookLog(log: schema.InsertWebhookLog): Promise<schema.WebhookLog>;
  updateWebhookLog(id: number, updates: Partial<schema.WebhookLog>): Promise<schema.WebhookLog | undefined>;
  reprocessWebhook(id: number): Promise<boolean>;
  
  // Subscription settings methods
  getSubscriptionSettings(): Promise<schema.SubscriptionSetting | undefined>;
  updateSubscriptionSettings(settings: Partial<schema.InsertSubscriptionSetting>): Promise<schema.SubscriptionSetting>;
  
  // Subscription statistics methods
  getSubscriptionStats(): Promise<schema.SubscriptionStats>;
  getSubscriptionTrends(months: number): Promise<schema.SubscriptionTrendData[]>;
}

interface ArtFilters {
  categoryId?: number | null;
  formatId?: number | null;
  fileTypeId?: number | null;
  fileType?: string;
  search?: string;
  isPremium?: boolean;
  isVisible?: boolean;
  sortBy?: string;
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
  
  // SEO methods
  async getAllArtsForSitemap(): Promise<Art[]> {
    try {
      // Selecionamos todos os campos necessários para o sitemap
      const result = await db.select()
      .from(arts)
      .where(eq(arts.isVisible, true))
      .orderBy(desc(arts.createdAt));

      return result;
    } catch (error) {
      console.error("Erro ao buscar artes para sitemap:", error);
      return [];
    }
  }

  async getArtBySlug(slug: string): Promise<Art | undefined> {
    try {
      const [result] = await db.select().from(arts).where(eq(arts.slug, slug));
      return result;
    } catch (error) {
      console.error("Erro ao buscar arte por slug:", error);
      return undefined;
    }
  }

  async getArtsByCategorySlug(categorySlug: string, page: number = 1, limit: number = 12): Promise<{ arts: Art[]; totalCount: number }> {
    try {
      // Primeiro, encontrar a categoria pelo slug
      const [category] = await db.select().from(categories).where(eq(categories.slug, categorySlug));
      
      if (!category) {
        return { arts: [], totalCount: 0 };
      }
      
      // Calcular o offset com base na página
      const offset = (page - 1) * limit;
      
      // Buscar artes desta categoria
      const result = await db.select().from(arts)
        .where(and(
          eq(arts.categoryId, category.id),
          eq(arts.isVisible, true)
        ))
        .orderBy(desc(arts.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Contar o total de artes nesta categoria para paginação
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(arts)
        .where(and(
          eq(arts.categoryId, category.id),
          eq(arts.isVisible, true)
        ));
      
      return { 
        arts: result,
        totalCount: Number(totalCount) 
      };
    } catch (error) {
      console.error("Erro ao buscar artes por categoria:", error);
      return { arts: [], totalCount: 0 };
    }
  }
  
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
          atualizadoem
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
          ${now}
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
        
        if (filters.fileType) {
          if (hasWhere) {
            query = sql`${query} AND "fileType" = ${filters.fileType}`;
          } else {
            query = sql`${query} WHERE "fileType" = ${filters.fileType}`;
            hasWhere = true;
          }
        }
      }
      
      // Adicionar ordenação baseada no parâmetro sortBy
      if (filters?.sortBy === 'destaques') {
        // Destaques: artes premium primeiro, depois por views
        query = sql`${query} ORDER BY "isPremium" DESC, "viewcount" DESC, "createdAt" DESC`;
      } else if (filters?.sortBy === 'emalta') {
        // Em alta: ordenar por views (popularidade)
        query = sql`${query} ORDER BY "viewcount" DESC, "createdAt" DESC`;
      } else if (filters?.sortBy === 'recentes') {
        // Recentes: mais novos primeiro
        query = sql`${query} ORDER BY "createdAt" DESC`;
      } else if (filters?.sortBy === 'antigos') {
        // Antigos: mais antigos primeiro
        query = sql`${query} ORDER BY "createdAt" ASC`;
      } else {
        // Ordenação padrão para painel administrativo: sempre por data de criação (mais recentes primeiro)
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
        
        if (filters.fileType) {
          if (hasWhere) {
            countQuery = sql`${countQuery} AND "fileType" = ${filters.fileType}`;
          } else {
            countQuery = sql`${countQuery} WHERE "fileType" = ${filters.fileType}`;
            hasWhere = true;
          }
        }
      }
      
      const countResult = await db.execute(countQuery);
      const totalCount = parseInt(countResult.rows[0].count as string);
      
      // Mapear os resultados para o tipo Art com nomes em camelCase
      const arts = result.rows.map(row => ({
        ...row,
        designerId: row.designerid,
        viewCount: row.viewcount,
        aspectRatio: row.aspectratio
      }));
      
      return {
        arts: arts as Art[],
        totalCount: totalCount
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
      // Primeiro obtém a arte de referência com sua categoria e groupId
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
          a."groupId",
          c.id as "category_id",
          c.name as "category_name",
          c.slug as "category_slug"
        FROM arts a
        LEFT JOIN categories c ON a."categoryId" = c.id
        WHERE a.id = ${artId}
      `);
      
      if (result.rows.length === 0) return [];
      const artRow = result.rows[0];
      
      console.log(`[getRelatedArts] Arte de referência: ID ${artId}, groupId: ${artRow.groupId || 'null'}`);
      
      // Array para armazenar todas as artes relacionadas
      const finalRelatedArts: Art[] = [];
      
      // PRIORIDADE MÁXIMA: Verificar se tem groupId e buscar outras artes do mesmo grupo
      if (artRow.groupId) {
        console.log(`[getRelatedArts] Buscando outras artes do mesmo grupo (groupId: ${artRow.groupId})`);
        
        // Busca artes do mesmo grupo, exceto a atual
        const groupArtsResult = await db.execute(sql`
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
            a."groupId",
            c.id as "category_id",
            c.name as "category_name",
            c.slug as "category_slug"
          FROM arts a
          LEFT JOIN categories c ON a."categoryId" = c.id
          WHERE a."groupId" = ${artRow.groupId} AND a.id != ${artId} AND a."isVisible" = true
        `);
        
        if (groupArtsResult.rows.length > 0) {
          console.log(`[getRelatedArts] Encontradas ${groupArtsResult.rows.length} artes do mesmo grupo`);
          
          // Mapear resultados para objetos Arte
          const groupArts = groupArtsResult.rows.map(a => {
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
          
          // Adicionar artes do mesmo grupo com maior prioridade
          finalRelatedArts.push(...groupArts);
          console.log(`[getRelatedArts] Adicionadas ${groupArts.length} artes do mesmo grupo à lista de recomendação`);
        }
      }
      
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
      // Se já temos artes de mesmo grupo, precisamos pegar apenas as vagas restantes
      const remainingKeywordLimit = limit - finalRelatedArts.length;
      
      if (remainingKeywordLimit > 0) {
        console.log(`[getRelatedArts] Buscando ${remainingKeywordLimit} artes adicionais por correspondência de palavras-chave`);
        
        // Filtrar artes que já estão incluídas na lista final
        const alreadyIncludedIds = new Set(finalRelatedArts.map(art => art.id));
        
        // Filtrar apenas artes que ainda não estão na lista
        const filteredScoredArts = scoredArts.filter(item => !alreadyIncludedIds.has(item.art.id));
        
        // Adicionar artes por palavras-chave para completar o limite
        const keywordArts = filteredScoredArts.slice(0, remainingKeywordLimit).map(item => item.art);
        finalRelatedArts.push(...keywordArts);
        
        console.log(`[getRelatedArts] Adicionadas ${keywordArts.length} artes por palavras-chave à lista de recomendação`);
      }
      
      // Se não tiver suficientes artes relacionadas, fazemos o preenchimento com outras estratégias
      if (finalRelatedArts.length < limit) {
        console.log(`[getRelatedArts] Artes por palavras-chave insuficientes (${finalRelatedArts.length}/${limit}). Buscando alternativas.`);
        
        // Filtrar artes que já estão incluídas
        const relatedArtIds = new Set(finalRelatedArts.map(art => art.id));
        
        // ESTRATÉGIA 1: Obter artes da mesma categoria que ainda não estão incluídas
        let additionalArts: Art[] = [];
        
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
        if (finalRelatedArts.length + additionalArts.length < limit) {
          console.log(`[getRelatedArts] Ainda insuficiente (${finalRelatedArts.length + additionalArts.length}/${limit}). Adicionando artes recentes.`);
          
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
            .slice(0, limit - (finalRelatedArts.length + additionalArts.length))
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
        const missingCount = limit - finalRelatedArts.length;
        if (missingCount > 0 && additionalArts.length > 0) {
          finalRelatedArts.push(...additionalArts.slice(0, missingCount));
        }
        
        console.log(`[getRelatedArts] Total final de artes relacionadas: ${finalRelatedArts.length}/${limit}`);
      }
      
      return finalRelatedArts;
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
    try {
      // Validar os parâmetros de entrada
      if (!followerId || !followingId || isNaN(Number(followerId)) || isNaN(Number(followingId))) {
        console.error("Parâmetros inválidos para isFollowing:", { followerId, followingId });
        return false;
      }
      
      // Garantir que os IDs sejam números
      const validFollowerId = Number(followerId);
      const validFollowingId = Number(followingId);
      
      // Consulta com parâmetros validados
      const results = await db.select()
        .from(userFollows)
        .where(and(
          eq(userFollows.followerId, validFollowerId),
          eq(userFollows.followingId, validFollowingId)
        ));
      
      return results.length > 0;
    } catch (error) {
      console.error("Erro ao verificar se usuário segue outro:", error);
      return false;
    }
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

  // Implementação dos métodos de Reports (Denúncias)
  async getReportTypes(): Promise<ReportType[]> {
    return db.select().from(reportTypes).orderBy(reportTypes.name);
  }

  async getReportById(id: number): Promise<Report | undefined> {
    try {
      console.log(`[DEBUG] getReportById(${id}) - Iniciando busca com consulta parametrizada...`);
      
      // Consulta SQL segura usando Drizzle query builder
      const result = await db.select().from(reports).where(eq(reports.id, id));
      
      console.log(`[DEBUG] getReportById(${id}) - Resultado da consulta SQL:`, result);
      
      if (!result || result.length === 0) {
        console.log(`[DEBUG] getReportById(${id}) - Denúncia não encontrada`);
        return undefined;
      }
      
      const report = result[0];
      console.log(`[DEBUG] getReportById(${id}) - Denúncia encontrada:`, report);
      
      return report as Report;
    } catch (error) {
      console.error(`[ERROR] getReportById(${id}) - Erro ao buscar denúncia:`, error);
      return undefined;
    }
  }

  async getReports(options: { page: number, limit: number, status?: string | null }): Promise<Report[]> {
    try {
      const { page = 1, limit = 20, status = null } = options;
      
      let query = db.select({
        report: reports,
        reportType: reportTypes,
        user: users,
        admin: users.as('admin')
      })
      .from(reports)
      .leftJoin(reportTypes, eq(reports.reportTypeId, reportTypes.id))
      .leftJoin(users, eq(reports.userId, users.id))
      .leftJoin(users.as('admin'), eq(reports.respondedBy, users.as('admin').id));
      
      if (status) {
        query = query.where(eq(reports.status, status));
      }
      
      const results = await query
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);
      
      console.log(`getReports - ${results.length} denúncias encontradas`, results[0]?.report?.id ? `(primeira: #${results[0].report.id})` : '');
      
      return results.map(result => ({
        ...result.report,
        reportType: result.reportType,
        user: result.user,
        admin: result.admin
      })) as unknown as Report[];
    } catch (error) {
      console.error('Erro ao buscar denúncias:', error);
      return [];
    }
  }

  async getReportsCount(status?: string | null): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(reports);
    if (status) {
      query = query.where(eq(reports.status, status));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  async createReport(report: InsertReport): Promise<Report> {
    try {
      console.log('Storage - criando denúncia com dados:', report);
      // Verificar se o reportTypeId é um número válido
      if (typeof report.reportTypeId !== 'number' || isNaN(report.reportTypeId)) {
        console.error('Erro na validação: reportTypeId inválido', report.reportTypeId);
        throw new Error('O tipo de denúncia fornecido é inválido');
      }
      
      const [result] = await db
        .insert(reports)
        .values({
          ...report,
          status: 'pendente', // Sempre definir o status como pendente por padrão
          isResolved: false,  // Sempre definir como não resolvido por padrão
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log('Storage - denúncia criada:', result);
      return result;
    } catch (error) {
      console.error('Erro ao criar denúncia:', error);
      throw new Error('Não foi possível criar a denúncia. Por favor, tente novamente.');
    }
  }

  async updateReport(id: number, data: Partial<Report>): Promise<Report | undefined> {
    try {
      console.log(`[DEBUG] updateReport(${id}) - Iniciando atualização da denúncia...`, data);
      
      // Preparar dados para atualização usando Drizzle query builder (seguro contra SQL injection)
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Adicionar campos condicionalmente
      if (data.status) updateData.status = data.status;
      if (data.adminResponse) updateData.adminResponse = data.adminResponse;
      if (data.respondedBy) updateData.respondedBy = data.respondedBy;
      if (data.respondedAt) updateData.respondedAt = data.respondedAt;
      if (data.isResolved !== undefined) updateData.isResolved = data.isResolved;
      if ('resolvedAt' in data && data.resolvedAt) updateData.resolvedAt = data.resolvedAt;
      
      console.log(`[DEBUG] updateReport(${id}) - Dados para atualização:`, updateData);
      
      // Executar atualização usando Drizzle query builder (parametrizada e segura)
      const [result] = await db
        .update(reports)
        .set(updateData)
        .where(eq(reports.id, id))
        .returning();
      
      console.log(`[DEBUG] updateReport(${id}) - Resultado da atualização:`, result);
      
      return result;
    } catch (error) {
      console.error(`[ERROR] updateReport(${id}) - Erro ao atualizar denúncia:`, error);
      throw new Error('Erro ao atualizar denúncia');
    }
  }

  // Report methods
  async getReportTypes(): Promise<ReportType[]> {
    try {
      const result = await db.select().from(reportTypes).where(eq(reportTypes.isActive, true));
      return result;
    } catch (error) {
      console.error('Erro ao buscar tipos de denúncias:', error);
      return [];
    }
  }

  async getReports(options: { page: number; limit: number; status?: string | null }): Promise<Report[]> {
    try {
      const { page, limit, status } = options;
      const offset = (page - 1) * limit;
      
      // Simplificando para garantir que funcione
      let query = db.select()
        .from(reports)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(reports.createdAt));

      // Aplicar filtro por status se fornecido
      if (status) {
        query = query.where(eq(reports.status, status));
      }
      
      const result = await query;
      
      // Retornar apenas os relatórios, sem os joins por enquanto
      return result.map(report => ({
        ...report,
        user: null,
        reportType: null,
        admin: null
      }));
    } catch (error) {
      console.error('Erro ao buscar denúncias:', error);
      return [];
    }
  }

  async getReportsCount(status?: string | null): Promise<number> {
    try {
      let query = db.select({ count: sql`count(*)` }).from(reports);
      
      // Aplicar filtro por status se fornecido
      if (status) {
        query = query.where(eq(reports.status, status));
      }
      
      const result = await query;
      return Number(result[0].count) || 0;
    } catch (error) {
      console.error('Erro ao contar denúncias:', error);
      return 0;
    }
  }

  async getReportById(id: number): Promise<Report | undefined> {
    try {
      const result = await db.select({
        report: reports,
        user: users,
        reportType: reportTypes,
        admin: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl
        }
      })
      .from(reports)
      .leftJoin(users, eq(reports.userId, users.id))
      .leftJoin(reportTypes, eq(reports.reportTypeId, reportTypes.id))
      .leftJoin(users, eq(reports.respondedBy, users.id), "admin")
      .where(eq(reports.id, id));
      
      if (!result.length) return undefined;
      
      // Transformar o resultado para o formato esperado
      return {
        ...result[0].report,
        user: result[0].user || null,
        reportType: result[0].reportType || null,
        admin: result[0].admin || null
      };
    } catch (error) {
      console.error(`Erro ao buscar denúncia #${id}:`, error);
      return undefined;
    }
  }

  async createReport(report: InsertReport): Promise<Report> {
    try {
      const [result] = await db.insert(reports)
        .values({
          ...report,
          status: 'pendente',
          isResolved: false
        })
        .returning();
      
      return result;
    } catch (error) {
      console.error('Erro ao criar denúncia:', error);
      throw new Error('Não foi possível criar a denúncia. Por favor, tente novamente.');
    }
  }

  async updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined> {
    try {
      const [result] = await db.update(reports)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(reports.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Erro ao atualizar denúncia #${id}:`, error);
      return undefined;
    }
  }

  // Webhook Logs Methods
  async getWebhookLogs(page: number, limit: number, filters?: {
    status?: string;
    eventType?: string;
    source?: string;
    search?: string;
  }): Promise<{ logs: schema.WebhookLog[], totalCount: number }> {
    try {
      // Log para depuração - valores recebidos
      console.log('DEBUG getWebhookLogs - Filtros recebidos:', {
        page, limit, filters,
        status: filters?.status,
        eventType: filters?.eventType,
        source: filters?.source,
        search: filters?.search
      });
      
      // Construir as condições de filtro
      let conditions = [];
      
      if (filters?.status && filters.status !== 'all') {
        conditions.push(eq(schema.webhookLogs.status, filters.status as any));
      }
      
      if (filters?.eventType && filters.eventType !== 'all') {
        conditions.push(eq(schema.webhookLogs.eventType, filters.eventType));
      }
      
      if (filters?.source && filters.source !== 'all') {
        conditions.push(eq(schema.webhookLogs.source, filters.source as any));
      }
      
      if (filters?.search && filters.search.trim()) {
        const search = `%${filters.search.trim()}%`;
        conditions.push(
          or(
            like(schema.webhookLogs.eventType, search),
            like(schema.webhookLogs.payloadData, search),
            like(schema.webhookLogs.transactionId || '', search),
            like(schema.webhookLogs.email || '', search)
          )
        );
      }
      
      // Construir query base
      let query = db.select().from(schema.webhookLogs);
      
      // Aplicar filtros se houver
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Contar total de registros com os filtros aplicados
      const countQuery = db.select({ count: count() }).from(schema.webhookLogs);
      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }
      const totalCount = await countQuery;
      
      // Aplicar ordem e paginação
      const logs = await query
        .orderBy(desc(schema.webhookLogs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);
      
      // Log de debug apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('DEBUG getWebhookLogs - Resultados simplificados:', {
          totalCount: Number(totalCount[0]?.count || 0),
          logCount: logs.length,
          primeiroLog: logs[0] ? { 
            id: logs[0].id, 
            tipo: logs[0].eventType,
            status: logs[0].status,
            data: typeof logs[0].createdAt
          } : 'Nenhum log encontrado'
        });
      }
      
      // Verificar se há dados deseriáveis e deserializá-los se necessário
      const processedLogs = logs.map(log => {
        // Se for uma string JSON, converter para objeto
        if (log.payloadData && typeof log.payloadData === 'string') {
          try {
            // Apenas para depuração, não altera o objeto original
            const parsed = JSON.parse(log.payloadData);
            console.log(`Log ${log.id} tem payloadData como string JSON válida`);
          } catch (e) {
            console.log(`Log ${log.id} tem payloadData como string, mas não é JSON válido`);
          }
        }
        
        // Garantir que as datas sejam strings ISO para serializá-las corretamente
        if (log.createdAt && typeof log.createdAt === 'object') {
          log.createdAt = log.createdAt.toISOString();
        }
        if (log.updatedAt && typeof log.updatedAt === 'object') {
          log.updatedAt = log.updatedAt.toISOString();
        }
        
        return log;
      });
      
      return {
        logs: processedLogs,
        totalCount: Number(totalCount[0]?.count || 0)
      };
    } catch (error) {
      console.error('Erro ao buscar logs de webhook:', error);
      return { logs: [], totalCount: 0 };
    }
  }

  async getWebhookLogById(id: number): Promise<schema.WebhookLog | undefined> {
    try {
      const [log] = await db.select()
        .from(schema.webhookLogs)
        .where(eq(schema.webhookLogs.id, id));
      
      return log;
    } catch (error) {
      console.error(`Erro ao buscar log de webhook #${id}:`, error);
      return undefined;
    }
  }

  async createWebhookLog(log: schema.InsertWebhookLog): Promise<schema.WebhookLog> {
    try {
      const [newLog] = await db.insert(schema.webhookLogs)
        .values(log)
        .returning();
      
      return newLog;
    } catch (error) {
      console.error('Erro ao criar log de webhook:', error);
      throw new Error('Não foi possível criar o log de webhook.');
    }
  }

  async updateWebhookLog(id: number, updates: Partial<schema.WebhookLog>): Promise<schema.WebhookLog | undefined> {
    try {
      const [result] = await db.update(schema.webhookLogs)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(schema.webhookLogs.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error(`Erro ao atualizar log de webhook #${id}:`, error);
      return undefined;
    }
  }

  async reprocessWebhook(id: number): Promise<boolean> {
    try {
      const webhookLog = await this.getWebhookLogById(id);
      
      if (!webhookLog) {
        console.error(`Log de webhook #${id} não encontrado para reprocessamento`);
        return false;
      }
      
      // Atualizar status e contador de tentativas
      await this.updateWebhookLog(id, {
        status: 'pending',
        retryCount: (webhookLog.retryCount || 0) + 1,
        errorMessage: null
      });
      
      // Aqui será implementada a lógica para reprocessar o webhook de acordo
      // com o tipo de evento. Por enquanto, simulamos sucesso.
      const eventData = webhookLog.payloadData ? JSON.parse(webhookLog.payloadData) : null;
      
      if (!eventData) {
        await this.updateWebhookLog(id, {
          status: 'error',
          errorMessage: 'Dados do payload não encontrados ou inválidos'
        });
        return false;
      }
      
      // Processar de acordo com o tipo de evento
      if (webhookLog.eventType === 'PURCHASE_APPROVED') {
        // Implementar lógica de processamento de compra aprovada
        // Por exemplo, atualizar assinatura de usuário
        
        // Simulando sucesso para demonstração
        await this.updateWebhookLog(id, {
          status: 'processed',
          errorMessage: null
        });
        
        return true;
      } else if (webhookLog.eventType === 'PURCHASE_CANCELED' || webhookLog.eventType === 'PURCHASE_REFUNDED') {
        // Implementar lógica de processamento de cancelamento/reembolso
        
        // Simulando sucesso para demonstração
        await this.updateWebhookLog(id, {
          status: 'processed',
          errorMessage: null
        });
        
        return true;
      } else {
        // Evento não reconhecido
        await this.updateWebhookLog(id, {
          status: 'error',
          errorMessage: `Tipo de evento não suportado: ${webhookLog.eventType}`
        });
        
        return false;
      }
    } catch (error) {
      console.error(`Erro ao reprocessar webhook #${id}:`, error);
      
      // Atualizar status para erro
      await this.updateWebhookLog(id, {
        status: 'error',
        errorMessage: `Erro ao reprocessar: ${error.message}`
      });
      
      return false;
    }
  }

  // Métodos de configurações de assinaturas
  async getSubscriptionSettings(): Promise<schema.SubscriptionSetting | undefined> {
    try {
      const [settings] = await db.select().from(schema.subscriptionSettings);
      return settings;
    } catch (error) {
      console.error("Erro ao buscar configurações de assinaturas:", error);
      return undefined;
    }
  }

  async updateSubscriptionSettings(settings: Partial<schema.InsertSubscriptionSetting>): Promise<schema.SubscriptionSetting> {
    try {
      // Buscar as configurações existentes
      const existingSettings = await this.getSubscriptionSettings();
      
      if (existingSettings) {
        // Atualizar configurações existentes
        const [updated] = await db.update(schema.subscriptionSettings)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(schema.subscriptionSettings.id, existingSettings.id))
          .returning();
        
        return updated;
      } else {
        // Criar configurações iniciais com valores padrão
        const [newSettings] = await db.insert(schema.subscriptionSettings)
          .values({
            ...settings,
            // Valores padrão para campos de integração
            webhookUrl: settings.webhookUrl || null,
            webhookSecretKey: settings.webhookSecretKey || null,
            hotmartEnvironment: settings.hotmartEnvironment || 'sandbox',
            hotmartClientId: settings.hotmartClientId || null,
            hotmartClientSecret: settings.hotmartClientSecret || null,
            hotmartBasicPlanId: settings.hotmartBasicPlanId || null,
            hotmartProPlanId: settings.hotmartProPlanId || null,
            
            // Valores padrão para campos de comportamento
            defaultSubscriptionDuration: settings.defaultSubscriptionDuration || 12,
            graceHoursAfterExpiration: settings.graceHoursAfterExpiration || 48,
            autoDowngradeAfterExpiration: settings.autoDowngradeAfterExpiration !== undefined ? 
              settings.autoDowngradeAfterExpiration : true,
            autoMapProductCodes: settings.autoMapProductCodes !== undefined ? 
              settings.autoMapProductCodes : true,
            
            // Valores padrão para campos de notificações
            sendExpirationWarningDays: settings.sendExpirationWarningDays || 3,
            sendExpirationWarningEmails: settings.sendExpirationWarningEmails !== undefined ? 
              settings.sendExpirationWarningEmails : true,
            notificationEmailSubject: settings.notificationEmailSubject || 
              'Sua assinatura do DesignAuto irá expirar em breve',
            notificationEmailTemplate: settings.notificationEmailTemplate || 
              'Olá {{nome}}, \n\nSua assinatura do DesignAuto irá expirar em {{dias_restantes}} dias ({{data_expiracao}}). \n\nPara continuar tendo acesso a todos os recursos premium, por favor renove sua assinatura.\n\nAtenciosamente,\nEquipe DesignAuto'
          })
          .returning();
        
        return newSettings;
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações de assinaturas:", error);
      throw new Error("Falha ao atualizar configurações de assinaturas");
    }
  }

  // Implementação das novas estatísticas e tendências
  async getSubscriptionStats(): Promise<schema.SubscriptionStats> {
    try {
      // Obter total de usuários com assinatura (exceto free)
      const [totalResult] = await db
        .select({ count: count() })
        .from(schema.users)
        .where(not(eq(schema.users.nivelacesso, 'free')));
      
      // Obter usuários com assinatura ativa
      const [activeResult] = await db
        .select({ count: count() })
        .from(schema.users)
        .where(
          and(
            not(eq(schema.users.nivelacesso, 'free')),
            or(
              isNull(schema.users.dataexpiracao),
              sql`${schema.users.dataexpiracao} > NOW()`,
              eq(schema.users.acessovitalicio, true)
            )
          )
        );
        
      // Calcular valor médio das assinaturas
      // Assumindo um valor base de R$ 97,00 por assinatura
      const averageValue = 97.00;
      
      // Calcular MRR (Monthly Recurring Revenue)
      const mrr = activeResult.count * averageValue;
      
      // Calcular receita anual projetada
      const annualRevenue = mrr * 12;
      
      // Calcular taxa de churn (estimativa básica)
      // Taxa de churn = usuários expirados / (usuários ativos + usuários expirados)
      const churnRate = totalResult.count > 0 
        ? (Number(expiredResult?.count || 0) / Number(totalResult.count)) * 100 
        : 0;
      
      // Tempo médio de permanência (estimativa em dias)
      const averageRetention = 365 - (churnRate * 3.65); // Uma aproximação baseada no churn
      
      // Valor médio por cliente ao longo da vida (LTV)
      const averageLTV = averageValue * (averageRetention / 30); // Convertendo dias para meses
      
      // Obter usuários com assinatura expirada
      const [expiredResult] = await db
        .select({ count: count() })
        .from(schema.users)
        .where(
          and(
            not(eq(schema.users.nivelacesso, 'free')),
            not(eq(schema.users.acessovitalicio, true)),
            not(isNull(schema.users.dataexpiracao)),
            sql`${schema.users.dataexpiracao} <= NOW()`
          )
        );
      
      // Obter usuários em teste
      const [trialResult] = await db
        .select({ count: count() })
        .from(schema.users)
        .where(eq(schema.users.tipoplano, 'trial'));
      
      // Obter usuários com assinatura expirando em 7 dias
      const [expiringIn7DaysResult] = await db
        .select({ count: count() })
        .from(schema.users)
        .where(
          and(
            not(eq(schema.users.nivelacesso, 'free')),
            not(eq(schema.users.acessovitalicio, true)),
            not(isNull(schema.users.dataexpiracao)),
            sql`${schema.users.dataexpiracao} > NOW()`,
            sql`${schema.users.dataexpiracao} <= NOW() + INTERVAL '7 days'`
          )
        );
      
      // Obter usuários com assinatura expirando em 30 dias
      const [expiringIn30DaysResult] = await db
        .select({ count: count() })
        .from(schema.users)
        .where(
          and(
            not(eq(schema.users.nivelacesso, 'free')),
            not(eq(schema.users.acessovitalicio, true)),
            not(isNull(schema.users.dataexpiracao)),
            sql`${schema.users.dataexpiracao} > NOW()`,
            sql`${schema.users.dataexpiracao} <= NOW() + INTERVAL '30 days'`
          )
        );
      
      // Obter contagem por origem de assinatura
      const originResults = await db
        .select({
          origin: schema.users.origemassinatura,
          count: count()
        })
        .from(schema.users)
        .where(
          and(
            not(eq(schema.users.nivelacesso, 'free')),
            not(isNull(schema.users.origemassinatura))
          )
        )
        .groupBy(schema.users.origemassinatura);
      
      // Formatar resultados por origem
      const byOrigin: Record<string, number> = {};
      originResults.forEach(result => {
        if (result.origin) {
          byOrigin[result.origin] = Number(result.count);
        }
      });
      
      // Adicionar valores padrão para origens sem dados
      const defaultOrigins = ['hotmart', 'doppus', 'manual'];
      defaultOrigins.forEach(origin => {
        if (!(origin in byOrigin)) {
          byOrigin[origin] = 0;
        }
      });
      
      return {
        total: Number(totalResult.count),
        active: Number(activeResult.count),
        expired: Number(expiredResult.count),
        trial: Number(trialResult.count),
        expiringIn7Days: Number(expiringIn7DaysResult.count),
        expiringIn30Days: Number(expiringIn30DaysResult.count),
        byOrigin,
        churnRate: parseFloat(churnRate.toFixed(1)),
        averageRetention: Math.round(averageRetention),
        averageLTV: parseFloat(averageLTV.toFixed(2)),
        mrr: parseFloat(mrr.toFixed(2)),
        averageValue: parseFloat(averageValue.toFixed(2)),
        annualRevenue: parseFloat(annualRevenue.toFixed(2))
      };
    } catch (error) {
      console.error("Erro ao buscar estatísticas de assinaturas:", error);
      // Retornar estatísticas zeradas em caso de erro
      return {
        total: 0,
        active: 0,
        expired: 0,
        trial: 0,
        expiringIn7Days: 0,
        expiringIn30Days: 0,
        byOrigin: { hotmart: 0, doppus: 0, manual: 0 },
        churnRate: 0,
        averageRetention: 0,
        averageLTV: 0,
        mrr: 0,
        averageValue: 0,
        annualRevenue: 0
      };
    }
  }

  async getSubscriptionTrends(months: number): Promise<schema.SubscriptionTrendData[]> {
    try {
      // Limitar o número de meses para evitar consultas muito pesadas
      const limit = Math.min(Math.max(1, months), 24);
      
      // Gerar uma série de datas (último dia de cada mês) para os meses solicitados
      const dates = [];
      const today = new Date();
      
      for (let i = 0; i < limit; i++) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        date.setDate(1); // Primeiro dia do mês
        date.setHours(0, 0, 0, 0);
        dates.push(date);
      }
      
      // Ordenar datas do mais antigo para o mais recente
      dates.sort((a, b) => a.getTime() - b.getTime());
      
      const result: schema.SubscriptionTrendData[] = [];
      let previousTotal = 0;
      
      // Para cada data, calcular o número de assinaturas ativas e expiradas
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Formatar data para SQL
        const dateStr = date.toISOString().split('T')[0];
        
        // Contar total de assinaturas (exceto free) até aquela data
        const [totalResult] = await db
          .select({ count: count() })
          .from(schema.users)
          .where(
            and(
              not(eq(schema.users.nivelacesso, 'free')),
              sql`${schema.users.criadoem} < ${nextMonth.toISOString()}`
            )
          );
        
        // Contar assinaturas ativas naquela data
        const [activeResult] = await db
          .select({ count: count() })
          .from(schema.users)
          .where(
            and(
              not(eq(schema.users.nivelacesso, 'free')),
              sql`${schema.users.criadoem} < ${nextMonth.toISOString()}`,
              or(
                isNull(schema.users.dataexpiracao),
                sql`${schema.users.dataexpiracao} > ${date.toISOString()}`,
                eq(schema.users.acessovitalicio, true)
              )
            )
          );
        
        // Contar assinaturas expiradas naquela data
        const [expiredResult] = await db
          .select({ count: count() })
          .from(schema.users)
          .where(
            and(
              not(eq(schema.users.nivelacesso, 'free')),
              not(eq(schema.users.acessovitalicio, true)),
              not(isNull(schema.users.dataexpiracao)),
              sql`${schema.users.criadoem} < ${nextMonth.toISOString()}`,
              sql`${schema.users.dataexpiracao} <= ${date.toISOString()}`
            )
          );
        
        const total = Number(totalResult.count);
        const growth = i === 0 ? 0 : ((total - previousTotal) / previousTotal) * 100;
        previousTotal = total;
        
        result.push({
          date: dateStr,
          total,
          active: Number(activeResult.count),
          expired: Number(expiredResult.count),
          growth: Math.round(growth * 100) / 100 // Arredondar para 2 casas decimais
        });
      }
      
      return result;
    } catch (error) {
      console.error("Erro ao buscar tendências de assinaturas:", error);
      return [];
    }
  }
}

// Inicialização do armazenamento
export const storage = new DatabaseStorage();
