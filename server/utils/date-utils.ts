/**
 * Utilitários para manipulação de datas com fuso horário do Brasil (UTC-3)
 */

/**
 * Constante com o fuso horário de Brasília (UTC-3)
 */
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Opções para formatação em pt-BR
 */
export const BRAZIL_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: BRAZIL_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

/**
 * Opções para formatação em pt-BR com hora
 */
export const BRAZIL_DATETIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: BRAZIL_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
};

/**
 * Obtém a data atual no fuso horário do Brasil (UTC-3)
 * @returns Data atual ajustada para UTC-3
 */
export function getBrazilDateTime(): Date {
  const now = new Date();
  // Criamos uma string no formato ISO usando o timezone do Brasil
  const brazilDateString = now.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE });
  // Convertemos esta string de volta para um objeto Date
  return new Date(brazilDateString);
}

/**
 * Converte uma data para o fuso horário do Brasil (UTC-3)
 * @param date Data a ser convertida
 * @returns Data ajustada para UTC-3
 */
export function convertToBrazilTimezone(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Convertemos para string no timezone do Brasil
  const brazilDateString = inputDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE });
  // Convertemos esta string de volta para um objeto Date
  return new Date(brazilDateString);
}

/**
 * Formata uma data no padrão brasileiro (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns String formatada
 */
export function formatBrazilDate(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.toLocaleDateString('pt-BR', BRAZIL_DATE_FORMAT_OPTIONS);
}

/**
 * Formata uma data e hora no padrão brasileiro (DD/MM/YYYY HH:MM:SS)
 * @param date Data a ser formatada
 * @returns String formatada
 */
export function formatBrazilDateTime(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.toLocaleString('pt-BR', BRAZIL_DATETIME_FORMAT_OPTIONS);
}

/**
 * Retorna uma string ISO no fuso horário do Brasil (para logs)
 * @param date Data a ser convertida (padrão: data atual)
 * @returns String no formato ISO com fuso horário do Brasil
 */
export function getBrazilISOString(date?: Date): string {
  const inputDate = date || new Date();
  // Convertemos para o fuso horário do Brasil
  const brazilDate = convertToBrazilTimezone(inputDate);
  
  // Formatamos manualmente para ter controle sobre o formato
  const year = brazilDate.getFullYear();
  const month = String(brazilDate.getMonth() + 1).padStart(2, '0');
  const day = String(brazilDate.getDate()).padStart(2, '0');
  const hours = String(brazilDate.getHours()).padStart(2, '0');
  const minutes = String(brazilDate.getMinutes()).padStart(2, '0');
  const seconds = String(brazilDate.getSeconds()).padStart(2, '0');
  const milliseconds = String(brazilDate.getMilliseconds()).padStart(3, '0');
  
  // Formato: YYYY-MM-DDTHH:MM:SS.sss-03:00 (Brasília)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}-03:00`;
}

/**
 * Adiciona um número específico de dias a uma data
 * @param date Data base
 * @param days Número de dias a adicionar
 * @returns Nova data com os dias adicionados
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adiciona um número específico de horas a uma data
 * @param date Data base
 * @param hours Número de horas a adicionar
 * @returns Nova data com as horas adicionadas
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Retorna a data atual formatada para armazenamento no banco de dados
 * (formato ISO sem timezone)
 * @returns Data atual no fuso horário do Brasil, formatada para o banco
 */
export function getBrazilDateTimeForDB(): string {
  const brazilDate = getBrazilDateTime();
  
  // Formatamos manualmente para o formato que o banco espera (YYYY-MM-DD HH:MM:SS)
  const year = brazilDate.getFullYear();
  const month = String(brazilDate.getMonth() + 1).padStart(2, '0');
  const day = String(brazilDate.getDate()).padStart(2, '0');
  const hours = String(brazilDate.getHours()).padStart(2, '0');
  const minutes = String(brazilDate.getMinutes()).padStart(2, '0');
  const seconds = String(brazilDate.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}