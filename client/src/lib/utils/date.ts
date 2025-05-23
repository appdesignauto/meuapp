import { differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths } from 'date-fns';

export const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const minutesDiff = differenceInMinutes(now, date);
  if (minutesDiff < 60) {
    return minutesDiff <= 1 ? 'agora mesmo' : `${minutesDiff} min`;
  }
  
  const hoursDiff = differenceInHours(now, date);
  if (hoursDiff < 24) {
    return `${hoursDiff}h`;
  }
  
  const daysDiff = differenceInDays(now, date);
  if (daysDiff < 30) {
    return `${daysDiff}d`;
  }
  
  const monthsDiff = differenceInMonths(now, date);
  return `${monthsDiff}m`;
}; 