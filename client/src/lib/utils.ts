import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return "Data não disponível";
  
  try {
    // Criar data a partir da string
    const utcDate = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(utcDate.getTime())) {
      console.error("Data inválida:", dateString);
      return "Data não disponível";
    }
    
    // Converter para horário de Brasília (UTC-3)
    const brasiliaOffset = -3 * 60; // Brasília é UTC-3 (em minutos)
    const userOffset = utcDate.getTimezoneOffset(); // Offset do navegador em minutos
    const offsetDiff = userOffset - brasiliaOffset; // Diferença entre o horário local e Brasília
    
    // Ajustar a data para o horário de Brasília
    const brasiliaDate = new Date(utcDate.getTime() + offsetDiff * 60 * 1000);
    const now = new Date();
    const localNow = new Date(now.getTime() + offsetDiff * 60 * 1000);
    
    // Calcular a diferença em dias
    const diffTime = Math.abs(localNow.getTime() - brasiliaDate.getTime());
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
    console.error("Erro ao formatar data:", error, "Data:", dateString);
    return "Data não disponível";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generatePlaceholderImage(width: number, height: number, text: string): string {
  return `https://via.placeholder.com/${width}x${height}.webp?text=${encodeURIComponent(text)}`;
}
