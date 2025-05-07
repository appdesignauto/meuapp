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

// Função auxiliar para formatar o tempo relativo a partir de uma data
function formatRelativeTime(date: Date): string {
  // Usar Intl.DateTimeFormat para obter a data no fuso horário de Brasília
  // Primeiro converter para string no formato ISO para garantir compatibilidade
  try {
    const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
    const fmtDate = new Date(dateFormatter.format(date));
    
    // Calcular diferença em dias
    const now = new Date();
    const nowBrasilia = new Date(dateFormatter.format(now));
    const diffTime = Math.abs(nowBrasilia.getTime() - fmtDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return "Atualizado há 1 dia";
    } else if (diffDays < 7) {
      return `Atualizado há ${diffDays} dias`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Atualizado há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `Atualizado há ${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
  } catch (error) {
    console.error("Erro ao calcular tempo relativo:", error);
    
    // Fallback para formato mais simples
    return `Atualizado em ${date.toLocaleDateString('pt-BR')}`;
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
