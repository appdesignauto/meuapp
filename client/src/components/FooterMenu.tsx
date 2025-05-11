import { Link, useLocation } from 'wouter';
import { Home, Grid3X3, Play, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const FooterMenu: React.FC = () => {
  const [location] = useLocation();
  
  // Itens do menu de navegação
  const menuItems = [
    {
      icon: Home,
      label: 'Início',
      href: '/',
      active: location === '/'
    },
    {
      icon: Grid3X3,
      label: 'Categorias',
      href: '/categorias',
      active: location === '/categorias' || location.startsWith('/categorias/')
    },
    {
      icon: Play,
      label: 'Videoaulas',
      href: '/videoaulas',
      active: location === '/videoaulas' || location.startsWith('/videoaulas/')
    },
    {
      icon: Users,
      label: 'Comunidade',
      href: '/comunidade',
      active: location === '/comunidade' || location.startsWith('/comunidade/')
    }
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-50">
      <div className="container max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="w-full">
              <div className={cn(
                "flex flex-col items-center justify-center py-2 rounded-md transition-colors",
                item.active 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
              )}>
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FooterMenu;