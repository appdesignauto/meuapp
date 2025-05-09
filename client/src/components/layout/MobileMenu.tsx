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
        className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-xl py-4 px-5 overflow-y-auto"
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
        
        {/* Perfil do usuário - apenas se estiver logado */}
        {user && (
          <div className="mb-6 pb-4 border-b border-gray-100">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 -mx-5 px-5 py-4 mb-4 border-b border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  {user.profileimageurl ? (
                    <img 
                      src={user.profileimageurl} 
                      alt={user.name || user.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-semibold">
                      {(user.name?.[0] || user.username[0]).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{user.name || user.username}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                  {user.tipoplano ? (
                    <span className="inline-block mt-1 text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {user.tipoplano}
                    </span>
                  ) : (
                    <span className="inline-block mt-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                      Conta Free
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Opções de usuário */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-neutral-500 mb-2 ml-1">SUA CONTA</h3>
              
              {/* Assinatura */}
              {user.nivelacesso === 'usuario' || !user.tipoplano ? (
                <Link
                  href="/planos"
                  className="flex items-center justify-between w-full py-3 px-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors"
                  onClick={onClose}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-white">
                      <Crown className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium text-blue-700 text-sm">Fazer Upgrade</span>
                      <p className="text-xs text-blue-600 opacity-80">Obtenha acesso ilimitado</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center bg-blue-600 text-white rounded-full text-xs px-2.5 py-1 font-medium">
                    PRO
                  </div>
                </Link>
              ) : (
                <Link
                  href="/painel/assinatura"
                  className="flex items-center justify-between w-full py-3 px-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-colors"
                  onClick={onClose}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-3 text-white">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium text-green-700 text-sm">Sua Assinatura</span>
                      <p className="text-xs text-green-600 opacity-80">Gerenciar plano {user.tipoplano}</p>
                    </div>
                  </div>
                </Link>
              )}
              
              {/* Downloads */}
              <Link
                href="/painel/downloads"
                className="flex items-center justify-between w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={onClose}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-gray-700">
                    <Download className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-gray-700 text-sm">Meus Downloads</span>
                </div>
                {user.nivelacesso === 'premium' || user.tipoplano ? (
                  <div className="flex items-center text-blue-600 bg-blue-50 rounded-full px-2.5 py-1">
                    <Infinity className="h-3.5 w-3.5 mr-0.5" />
                    <span className="text-xs font-medium">Ilimitado</span>
                  </div>
                ) : (
                  <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full">
                    {userStats?.totalDownloads || 0}/10
                  </span>
                )}
              </Link>
              
              {/* Favoritos */}
              <Link
                href="/painel/favoritas"
                className="flex items-center justify-between w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={onClose}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3 text-red-500">
                    <Heart className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-gray-700 text-sm">Favoritos</span>
                </div>
                {user.nivelacesso === 'premium' || user.tipoplano ? (
                  <div className="flex items-center text-blue-600 bg-blue-50 rounded-full px-2.5 py-1">
                    <Infinity className="h-3.5 w-3.5 mr-0.5" />
                    <span className="text-xs font-medium">Ilimitado</span>
                  </div>
                ) : (
                  <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full">
                    {userStats?.totalFavorites || 0}/20
                  </span>
                )}
              </Link>
              
              {/* Meu Perfil */}
              <Link
                href="/painel/perfil"
                className="flex items-center w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={onClose}
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 text-purple-600">
                  <Settings className="h-4 w-4" />
                </div>
                <span className="font-medium text-gray-700 text-sm">Configurações</span>
              </Link>
              
              {/* Admin */}
              {(user.role === 'admin' || user.role === 'designer_adm') && (
                <Link
                  href="/admin"
                  className="flex items-center w-full py-3 px-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-amber-700"
                  onClick={onClose}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center mr-3 text-amber-700">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Painel Admin</span>
                </Link>
              )}
              
              {/* Divisor */}
              <div className="border-t border-gray-200 my-3"></div>
              
              {/* Logout */}
              <Button 
                onClick={() => {
                  logoutMutation.mutate();
                  onClose();
                }}
                variant="ghost"
                className="flex items-center w-full py-3 px-4 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3 text-red-500">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Sair da conta</span>
              </Button>
            </div>
          </div>
        )}
        
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
