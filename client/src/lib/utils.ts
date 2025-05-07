import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return "Data não disponível";
  
  try {
    // Criar data a partir da string
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.error("Data inválida:", dateString);
      return "Data não disponível";
    }
    
    // Verificar se a data é futura (tolerância de 5 minutos para evitar problemas de sincronização)
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos em milissegundos
    if (date.getTime() > now.getTime() + fiveMinutes) {
      console.error("Data futura detectada:", dateString, "Data:", date, "Agora:", now);
      // Usar a data atual em vez da data futura
      return formatRelativeTime(new Date());
    }
    
    return formatRelativeTime(date);
  } catch (error) {
    console.error("Erro ao formatar data:", error, "Data:", dateString);
    return "Data não disponível";
  }
}

// Função auxiliar para formatar o tempo relativo a partir de uma data (similar ao Instagram)
function formatRelativeTime(date: Date): string {
  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Evitar tempos negativos (futuro)
    if (diffMs < 0) return "agora";
    
    // Convertendo para segundos, minutos, horas, etc.
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Formatação estilo Instagram
    if (diffSeconds < 60) {
      return diffSeconds <= 5 ? "agora" : `${diffSeconds} s`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes} m`;
    } else if (diffHours < 24) {
      return `${diffHours} h`;
    } else if (diffDays < 7) {
      return `${diffDays} d`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} sem`;
    } else if (diffMonths < 12) {
      return `${diffMonths} m`;
    } else {
      return `${diffYears} a`;
    }
  } catch (error) {
    console.error("Erro ao calcular tempo relativo:", error);
    
    // Fallback para formato mais simples
    return date.toLocaleDateString('pt-BR');
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generatePlaceholderImage(width: number, height: number, text: string): string {
  return `https://via.placeholder.com/${width}x${height}.webp?text=${encodeURIComponent(text)}`;
}

// Função para obter iniciais do nome
export function getInitials(name: string): string {
  if (!name) return '';
  
  // Dividir o nome em partes e pegar a primeira letra de cada parte
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2); // Limitar a 2 caracteres
}
