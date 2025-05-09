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
    
    // Verificar se a data é futura (mas usar a data original mesmo assim)
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos em milissegundos
    if (date.getTime() > now.getTime() + fiveMinutes) {
      console.error("Data futura detectada:", dateString, "Data:", date, "Agora:", now);
      // Continuar usando a data original - correção para evitar mostrar "agora" para todos os posts
    }
    
    return formatRelativeTime(date);
  } catch (error) {
    console.error("Erro ao formatar data:", error, "Data:", dateString);
    return "Data não disponível";
  }
}

// Função auxiliar para formatar o tempo relativo a partir de uma data (formato híbrido mais descritivo)
function formatRelativeTime(date: Date): string {
  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Se a data for do futuro (diferença negativa), mostrar data formatada em vez de "agora"
    if (diffMs < 0) {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      }).format(date);
    }
    
    // Convertendo para segundos, minutos, horas, etc.
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Formatação híbrida mais descritiva
    if (diffSeconds < 60) {
      return diffSeconds <= 5 ? "agora" : `há ${diffSeconds} segundos`;
    } else if (diffMinutes < 60) {
      return `há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHours < 24) {
      return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffDays < 7) {
      return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else {
      // Para posts mais antigos que 7 dias, mostrar a data completa
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      }).format(date);
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
