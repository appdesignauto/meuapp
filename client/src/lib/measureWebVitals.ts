import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { reportWebVitals } from './webVitals';

/**
 * Função para iniciar a medição de todas as métricas do Core Web Vitals
 * 
 * Esta função deve ser chamada uma vez, na inicialização da aplicação
 */
export function measureWebVitals() {
  // Iniciar medição do Cumulative Layout Shift
  onCLS((metric: Metric) => {
    reportWebVitals(metric);
  });
  
  // Iniciar medição do First Contentful Paint
  onFCP((metric: Metric) => {
    reportWebVitals(metric);
  });
  
  // Iniciar medição do Interaction to Next Paint (substitui o FID)
  onINP((metric: Metric) => {
    reportWebVitals(metric);
  });
  
  // Iniciar medição do Largest Contentful Paint
  onLCP((metric: Metric) => {
    reportWebVitals(metric);
  });
  
  // Iniciar medição do Time to First Byte
  onTTFB((metric: Metric) => {
    reportWebVitals(metric);
  });
  
  // Log inicial para confirmar instrumentação
  console.info('🔍 Core Web Vitals measurement activated');
}