/**
 * Logger simplificado para uso nos módulos de webhook
 */

/**
 * Cria um logger com namespace específico
 */
export function createLogger(namespace: string) {
  return {
    debug: (message: string) => {
      console.log(`DEBUG [${namespace}] ${message}`);
    },
    info: (message: string) => {
      console.log(`INFO [${namespace}] ${message}`);
    },
    warn: (message: string) => {
      console.warn(`WARN [${namespace}] ${message}`);
    },
    error: (message: string) => {
      console.error(`ERROR [${namespace}] ${message}`);
    }
  };
}