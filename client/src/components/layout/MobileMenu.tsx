import { Link } from 'wouter';
import { 
  Crown, 
  X, 
  LayoutDashboard, 
  User, 
  Heart, 
  Download, 
  Settings,
  LogOut,
  CreditCard,
  Infinity,
  PlayCircle,
  Home,
  Library,
  Users,
  BookOpen,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: { name: string; path: string; icon?: React.ReactNode }[];
  userRole?: string;
}

const MobileMenu = ({ isOpen, onClose, navLinks, userRole }: MobileMenuProps) => {
  const { user, logoutMutation } = useAuth();
  
  // Buscar estatísticas do usuário para exibir no menu
  const { data: userStats } = useQuery({
    queryKey: ['/api/users/stats'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch('/api/users/stats');
      if (!res.ok) return { totalFavorites: 0, totalDownloads: 0, totalViews: 0 };
      return res.json();
    },
    enabled: !!user, // Só executa se o usuário estiver logado
  });
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={onClose}>
      <div 
        className="absolute left-0 right-0 top-0 max-h-[90vh] w-full bg-white shadow-xl py-4 px-5 overflow-y-auto rounded-b-2xl mobile-menu-dropdown custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-100">
          <h2 className="text-lg font-semibold text-blue-600">Menu</h2>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-blue-600 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Removida a seção de perfil do usuário conforme solicitado */}
        
        <nav className="flex flex-col space-y-2 mb-6">
          <h3 className="text-xs font-medium text-neutral-500 mb-1 ml-1">NAVEGAÇÃO</h3>
          {/* Enlaces de navegación principal */}
          {navLinks.map((link) => {
              const isVideoaulasPage = window.location.pathname.includes('/videoaulas');
              const isActive = window.location.pathname === link.path || 
                (link.path === '/videoaulas' && isVideoaulasPage);
              
              // Ocultar link de Categorias quando na página de videoaulas
              if (isVideoaulasPage && link.path === '/categories') {
                return null;
              }
              
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center rounded-lg ${isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-neutral-700 hover:bg-gray-50 hover:text-blue-600'} 
                    py-3 px-4 transition-colors`}
                  onClick={onClose}
                >
                  {link.icon && (
                    <span className={`mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {link.icon}
                    </span>
                  )}
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      Atual
                    </span>
                  )}
                </Link>
              );
            })}
          
          {/* Botões de Login e Cadastro (exibidos apenas se não houver usuário) */}
          {!user && (
            <div className="mt-6 space-y-3 px-1">
              <h3 className="text-xs font-medium text-neutral-500 mb-2 ml-1">CONTA</h3>
              <Link
                href="/login"
                className="flex justify-center items-center bg-blue-600 text-white font-medium rounded-lg py-3.5 px-4 hover:bg-blue-700 shadow-sm"
                onClick={onClose}
              >
                <User className="h-4 w-4 mr-2" />
                Entrar na sua conta
              </Link>
              <Link
                href="/register"
                className="flex justify-center items-center bg-white text-blue-600 font-medium rounded-lg py-3.5 px-4 hover:bg-blue-50 border border-blue-200"
                onClick={onClose}
              >
                <Users className="h-4 w-4 mr-2" />
                Criar uma conta
              </Link>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
