// Sistema avançado de gerenciamento de cache para resolver problemas em produção
class CacheManager {
  private static instance: CacheManager;
  private cacheVersion: string;
  private forceRefresh = false;

  constructor() {
    // Usar timestamp do build + versão do app para cache busting
    this.cacheVersion = `v${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Adicionar parâmetros anti-cache a URLs
  addCacheBuster(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    return `${url}${separator}_v=${this.cacheVersion}&_t=${timestamp}&_r=${Math.random()}`;
  }

  // Limpar todos os caches do navegador
  async clearAllCaches(): Promise<void> {
    try {
      // Service Worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // LocalStorage
      localStorage.clear();
      
      // SessionStorage
      sessionStorage.clear();

      console.log('[CacheManager] Todos os caches foram limpos');
    } catch (error) {
      console.error('[CacheManager] Erro ao limpar caches:', error);
    }
  }

  // Forçar refresh sem cache
  forceRefreshMode(): void {
    this.forceRefresh = true;
    this.cacheVersion = `v${Date.now()}_force_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Verificar se está em modo de refresh forçado
  isForceRefreshMode(): boolean {
    return this.forceRefresh;
  }

  // Headers anti-cache para requisições
  getAntiCacheHeaders(): HeadersInit {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
      'If-None-Match': '*',
      'X-Cache-Buster': this.cacheVersion
    };
  }

  // Detectar problemas de cache
  detectCacheIssues(): boolean {
    const userAgent = navigator.userAgent;
    const isOldBrowser = /Chrome\/[1-8][0-9]\.|Firefox\/[1-8][0-9]\.|Safari\/[1-5][0-9]\./.test(userAgent);
    
    // Verificar se há recursos em cache antigo
    const hasOldCache = localStorage.getItem('app_version') !== this.cacheVersion;
    
    if (isOldBrowser || hasOldCache) {
      console.warn('[CacheManager] Possível problema de cache detectado');
      return true;
    }
    
    return false;
  }

  // Versão atual do cache
  getCacheVersion(): string {
    return this.cacheVersion;
  }

  // Inicializar cache manager
  initialize(): void {
    // Marcar versão atual
    localStorage.setItem('app_version', this.cacheVersion);
    
    // Detectar e resolver problemas de cache
    if (this.detectCacheIssues()) {
      this.forceRefreshMode();
    }

    console.log(`[CacheManager] Inicializado com versão: ${this.cacheVersion}`);
  }
}

export const cacheManager = CacheManager.getInstance();