
import { useQuery } from '@tanstack/react-query';
import { authQueryOptions } from '@/lib/query-config';

export function useOptimizedAuth() {
  return useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch('/api/user', { 
          credentials: 'include',
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (res.status === 401) return null;
        if (!res.ok) throw new Error('Auth check failed');
        
        return await res.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Auth request timeout');
        }
        return null;
      }
    },
    ...authQueryOptions
  });
}
