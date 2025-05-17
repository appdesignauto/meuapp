/**
 * Utilitários de data para o sistema
 * Definições de timezone e formatação de datas
 */

// Fuso horário do Brasil (São Paulo/Brasília)
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', { timeZone: BRAZIL_TIMEZONE });
}

/**
 * Alias para formatDateBR - compatibilidade com código existente
 */
export const formatBrazilDate = formatDateBR;

/**
 * Formata uma data para o formato brasileiro com hora (DD/MM/YYYY HH:MM)
 */
export function formatDateTimeBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Alias para formatDateTimeBR - compatibilidade com código existente
 */
export const formatBrazilDateTime = formatDateTimeBR;

/**
 * Retorna a data atual no fuso horário do Brasil
 */
export function getCurrentDateBR(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
}

/**
 * Obtém a data atual no fuso horário do Brasil
 */
export function getBrazilDateTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
}

/**
 * Obtém a string ISO da data atual no fuso horário do Brasil
 */
export function getBrazilISOString(): string {
  return getBrazilDateTime().toISOString();
}