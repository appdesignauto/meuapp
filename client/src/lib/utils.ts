import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
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
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generatePlaceholderImage(width: number, height: number, text: string): string {
  return `https://via.placeholder.com/${width}x${height}.webp?text=${encodeURIComponent(text)}`;
}
