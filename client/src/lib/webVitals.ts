import { CLSMetric, FCPMetric, FIDMetric, LCPMetric, TTFBMetric } from 'web-vitals';

// Tipos de métricas de Web Vitals
type MetricName = 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB';
type WebVitalsMetric = CLSMetric | FCPMetric | FIDMetric | LCPMetric | TTFBMetric;

// Tipos de funções de reportagem
interface ReportMetricOptions {
  debug?: boolean;
  endpoint?: string;
  analyticsId?: string;
}

// Função para reportar métricas para o console ou para um serviço de analytics
const reportWebVitals = (metric: WebVitalsMetric, options: ReportMetricOptions = {}) => {
  const { name, id, value, delta, navigationType } = metric;
  const { debug = true, endpoint, analyticsId } = options;
  
  // Formatar o valor para maior legibilidade
  const formattedValue = formatMetricValue(name as MetricName, value);
  
  // Sempre registrar no console em desenvolvimento
  if (debug) {
    const color = getMetricColor(name as MetricName, value);
    const icon = getMetricIcon(name as MetricName, value);
    
    console.groupCollapsed(
      `%c${icon} ${name}: ${formattedValue}`,
      `color: ${color}; font-weight: bold;`
    );
    console.log('ID:', id);
    console.log('Valor:', value);
    console.log('Delta:', delta);
    console.log('Tipo de navegação:', navigationType);
    console.groupEnd();
  }
  
  // Se um endpoint for fornecido, enviar dados para ele
  if (endpoint) {
    const body = JSON.stringify({
      name,
      id, 
      value,
      delta,
      analyticsId
    });
    
    // Usar Navigator.sendBeacon() se disponível, ou fetch como fallback
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      fetch(endpoint, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' }
      }).catch(error => {
        console.error('Erro ao enviar métrica Web Vitals:', error);
      });
    }
  }
};

// Formatar o valor da métrica para ser mais legível
const formatMetricValue = (name: MetricName, value: number): string => {
  switch (name) {
    case 'CLS':
      return value.toFixed(3); // Sem unidade, é um score
    case 'FCP':
    case 'LCP':
    case 'TTFB':
    case 'FID':
      return `${Math.round(value)}ms`; // Milissegundos
    default:
      return `${value}`;
  }
};

// Determinar a cor com base na qualidade da métrica (bom, médio, ruim)
const getMetricColor = (name: MetricName, value: number): string => {
  switch (name) {
    case 'CLS':
      return value <= 0.1 ? 'green' : value <= 0.25 ? 'orange' : 'red';
    case 'FCP':
      return value <= 1800 ? 'green' : value <= 3000 ? 'orange' : 'red';
    case 'LCP':
      return value <= 2500 ? 'green' : value <= 4000 ? 'orange' : 'red';
    case 'FID':
      return value <= 100 ? 'green' : value <= 300 ? 'orange' : 'red';
    case 'TTFB':
      return value <= 800 ? 'green' : value <= 1800 ? 'orange' : 'red';
    default:
      return 'black';
  }
};

// Fornecer um ícone com base na qualidade da métrica
const getMetricIcon = (name: MetricName, value: number): string => {
  // Determinar se a métrica está em bom estado
  const isGood = 
    (name === 'CLS' && value <= 0.1) ||
    (name === 'FCP' && value <= 1800) ||
    (name === 'LCP' && value <= 2500) ||
    (name === 'FID' && value <= 100) ||
    (name === 'TTFB' && value <= 800);
  
  // Ícones com base na qualidade
  return isGood ? '✅' : '⚠️';
};

export { reportWebVitals };