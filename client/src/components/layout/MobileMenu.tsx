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
  Infinity 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: { name: string; path: string }[];
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
        className="absolute right-0 top-0 h-full w-3/4 max-w-xs bg-white shadow-xl py-4 px-6 overflow-y-auto"
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {user.profileimageurl ? (
                  <img 
                    src={user.profileimageurl} 
                    alt={user.name || user.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-medium">
                    {(user.name?.[0] || user.username[0]).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{user.name || user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            {/* Opções de usuário */}
            <div className="mt-4 space-y-3">
              {/* Assinatura */}
              {user.nivelacesso === 'usuario' || !user.tipoplano ? (
                <Link
                  href="/pricing"
                  className="flex items-center justify-between w-full py-2 px-3 bg-blue-50 rounded-md"
                  onClick={onClose}
                >
                  <div className="flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="font-medium text-blue-600">Assinatura (UPGRADE)</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Free</Badge>
                </Link>
              ) : (
                <Link
                  href="/painel/assinatura"
                  className="flex items-center justify-between w-full py-2 px-3 bg-gray-50 rounded-md"
                  onClick={onClose}
                >
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    <span>Assinatura (Gerenciar)</span>
                  </div>
                  <Badge className="bg-neutral-100 text-neutral-700">{user.tipoplano}</Badge>
                </Link>
              )}
              
              {/* Downloads */}
              <Link
                href="/painel/downloads"
                className="flex items-center justify-between w-full py-2 px-3 bg-gray-50 rounded-md"
                onClick={onClose}
              >
                <div className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  <span>Downloads</span>
                </div>
                {user.nivelacesso === 'premium' || user.tipoplano ? (
                  <div className="flex items-center text-blue-600">
                    <Infinity className="h-4 w-4" />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{userStats?.totalDownloads || 0}/10</span>
                )}
              </Link>
              
              {/* Favoritos */}
              <Link
                href="/painel/favoritas"
                className="flex items-center justify-between w-full py-2 px-3 bg-gray-50 rounded-md"
                onClick={onClose}
              >
                <div className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  <span>Favoritos</span>
                </div>
                {user.nivelacesso === 'premium' || user.tipoplano ? (
                  <div className="flex items-center text-blue-600">
                    <Infinity className="h-4 w-4" />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{userStats?.totalFavorites || 0}/20</span>
                )}
              </Link>
              
              {/* Meu Perfil */}
              <Link
                href="/painel/perfil"
                className="flex items-center w-full py-2 px-3 bg-gray-50 rounded-md"
                onClick={onClose}
              >
                <Settings className="h-5 w-5 mr-2" />
                <span>Meu Perfil</span>
              </Link>
              
              {/* Admin */}
              {(user.role === 'admin' || user.role === 'designer_adm') && (
                <Link
                  href="/admin"
                  className="flex items-center w-full py-2 px-3 bg-blue-50 text-blue-600 rounded-md"
                  onClick={onClose}
                >
                  <LayoutDashboard className="h-5 w-5 mr-2" />
                  <span className="font-medium">Painel Admin</span>
                </Link>
              )}
              
              {/* Logout */}
              <Button 
                onClick={() => {
                  logoutMutation.mutate();
                  onClose();
                }}
                variant="ghost"
                className="flex items-center w-full py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md"
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        )}
        
        <nav className="flex flex-col space-y-5">
          {/* Enlaces de navegación principal */}
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className="text-neutral-700 hover:text-blue-600 font-medium py-2 border-b border-neutral-100 transition-colors"
              onClick={onClose}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Botão Login (exibido apenas se não houver usuário) */}
          {!user && (
            <Link
              href="/auth"
              className="flex justify-center items-center bg-blue-600 text-white font-medium rounded-lg py-3 px-4 mt-4 hover:bg-blue-700"
              onClick={onClose}
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
