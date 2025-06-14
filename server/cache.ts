/**
 * Sistema de Cache em Memória para Otimização de Performance
 * 
 * Este cache reduz drasticamente as consultas ao banco de dados
 * cachando dados que são solicitados frequentemente por múltiplos usuários
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live em millisegundos
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  
  // TTL padrão para diferentes tipos de dados (em minutos)
  private defaultTTL = {
    siteSettings: 30,      // Configurações do site - 30 min
    categories: 15,        // Categorias - 15 min
    formats: 15,           // Formatos - 15 min
    fileTypes: 15,         // Tipos de arquivo - 15 min
    courseModules: 10,     // Módulos de curso - 10 min
    courseLessons: 10,     // Aulas de curso - 10 min
    courseSettings: 30,    // Configurações de curso - 30 min
    artsPopular: 5,        // Artes populares - 5 min
    userStats: 2,          // Estatísticas do usuário - 2 min
    dashboardStats: 3,     // Estatísticas do dashboard - 3 min
    contentPerformance: 5, // Performance de conteúdo - 5 min
  };

  /**
   * Armazena dados no cache
   */
  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = (ttlMinutes || this.getDefaultTTL(key)) * 60 * 1000;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Recupera dados do cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verifica se o cache expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Remove item específico do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Remove itens por padrão (ex: "user:*")
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove itens expirados
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Obtém TTL padrão baseado no tipo de chave
   */
  private getDefaultTTL(key: string): number {
    for (const [type, ttl] of Object.entries(this.defaultTTL)) {
      if (key.includes(type)) {
        return ttl;
      }
    }
    return 5; // TTL padrão de 5 minutos
  }
}

// Instância global do cache
export const cache = new MemoryCache();

// Limpeza automática a cada 10 minutos
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

/**
 * Decorator para cachear resultados de funções
 */
export function cacheable<T>(
  keyGenerator: (...args: any[]) => string,
  ttlMinutes?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args);
      
      // Tenta recuperar do cache primeiro
      const cached = cache.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Se não estiver no cache, executa a função original
      const result = await method.apply(this, args);
      
      // Armazena o resultado no cache
      cache.set(cacheKey, result, ttlMinutes);
      
      return result;
    };
  };
}

/**
 * Middleware para invalidar cache quando dados são modificados
 */
export function invalidateCache(patterns: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      // Invalida os padrões de cache especificados
      patterns.forEach(pattern => {
        cache.deletePattern(pattern);
      });
      
      return result;
    };
  };
}