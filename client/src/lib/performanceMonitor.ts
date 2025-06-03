// Sistema de monitoramento de performance para detectar problemas antes que afetem usuários
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private errorCount = 0;
  private slowRequestThreshold = 5000; // 5 segundos

  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordRequestTime(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    const times = this.metrics.get(endpoint)!;
    times.push(duration);
    
    // Manter apenas os últimos 10 registros
    if (times.length > 10) {
      times.shift();
    }

    // Alertar sobre requisições lentas
    if (duration > this.slowRequestThreshold) {
      console.warn(`[Performance] Requisição lenta detectada: ${endpoint} (${duration}ms)`);
    }
  }

  recordError(error: Error, context: string) {
    this.errorCount++;
    console.error(`[Performance] Erro registrado em ${context}:`, error);
    
    // Se muitos erros estão ocorrendo, sugerir recarregamento
    if (this.errorCount > 5) {
      this.suggestReload();
    }
  }

  getAverageTime(endpoint: string): number {
    const times = this.metrics.get(endpoint);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  checkConnectionHealth(): boolean {
    // Verificar se há muitas requisições lentas
    const averages = Array.from(this.metrics.entries()).map(([endpoint, times]) => ({
      endpoint,
      average: this.getAverageTime(endpoint)
    }));

    const slowEndpoints = averages.filter(({ average }) => average > this.slowRequestThreshold);
    
    if (slowEndpoints.length > 2) {
      console.warn('[Performance] Múltiplos endpoints lentos detectados:', slowEndpoints);
      return false;
    }

    return true;
  }

  private suggestReload() {
    if (typeof window !== 'undefined' && window.confirm) {
      const shouldReload = window.confirm(
        'Múltiplos problemas foram detectados. Deseja recarregar a página para melhorar a performance?'
      );
      
      if (shouldReload) {
        window.location.reload();
      }
    }
  }

  getStatus() {
    return {
      totalErrors: this.errorCount,
      connectionHealthy: this.checkConnectionHealth(),
      metrics: Object.fromEntries(
        Array.from(this.metrics.entries()).map(([endpoint, times]) => [
          endpoint,
          {
            average: this.getAverageTime(endpoint),
            recent: times.slice(-3)
          }
        ])
      )
    };
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();