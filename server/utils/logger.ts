/**
 * Sistema de logging condicional para otimizar performance em produção
 * Remove logs desnecessários automaticamente em ambiente de produção
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // Log de desenvolvimento - apenas em dev
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  // Log de informação - sempre mostrar
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },

  // Log de aviso - sempre mostrar
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  // Log de erro - sempre mostrar
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  // Log de API - apenas em dev ou quando explicitamente solicitado
  api: (message: string, ...args: any[]) => {
    if (isDevelopment || process.env.LOG_API === 'true') {
      console.log(`[API] ${message}`, ...args);
    }
  },

  // Log de database - apenas em dev ou quando explicitamente solicitado
  db: (message: string, ...args: any[]) => {
    if (isDevelopment || process.env.LOG_DB === 'true') {
      console.log(`[DB] ${message}`, ...args);
    }
  }
};

// Helper para logs condicionais inline
export const conditionalLog = (condition: boolean, message: string, ...args: any[]) => {
  if (condition && isDevelopment) {
    console.log(message, ...args);
  }
};