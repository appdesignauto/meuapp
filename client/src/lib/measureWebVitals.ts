import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';
import { reportWebVitals } from './webVitals';

/**
 * Função para iniciar a medição de todas as métricas do Core Web Vitals
 * 
 * Esta função deve ser chamada uma vez, na inicialização da aplicação
 */
export function measureWebVitals() {
  // Iniciar medição do Cumulative Layout Shift
  getCLS(metric => {
    reportWebVitals(metric);
  });
  
  // Iniciar medição do First Contentful Paint
  getFCP(metric => {
    reportWebVitals(metric);
  });
  
  // Iniciar medição do First Input Delay
  getFID(metric => {
    reportWebVitals(metric);
  });
  
  // Iniciar medição do Largest Contentful Paint
  getLCP(metric => {
    reportWebVitals(metric);
  });
  
  // Iniciar medição do Time to First Byte
  getTTFB(metric => {
    reportWebVitals(metric);
  });
  
  // Log inicial para confirmar instrumentação
  console.info('🔍 Core Web Vitals measurement activated');
}