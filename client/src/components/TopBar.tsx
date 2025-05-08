import { ChevronLeft, Menu, Users } from 'lucide-react';
import { Link } from 'wouter';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backPath?: string;
  children?: React.ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({ 
  title,
  showBack = false,
  backPath = '/',
  children
}) => {
  const { user } = useAuth();
  
  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="container h-14 max-w-5xl flex items-center justify-between">
        <div className="flex items-center">
          {showBack ? (
            <Link href={backPath}>
              <Button variant="ghost" size="icon" className="mr-1">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/" className="flex items-center">
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                DesignAuto
              </span>
            </Link>
          )}
          
          {title && !showBack && (
            <span className="mx-4 text-zinc-300 dark:text-zinc-700">|</span>
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {title}
            </h1>
          )}
          
          {children}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Link para comunidade - único atalho adicional */}
          <Link href="/comunidade">
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Comunidade</span>
            </Button>
          </Link>
          
          {/* Perfil e menu móvel */}
          {user ? (
            <Link href="/painel/perfil">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage 
                  src={user.profileimageurl || undefined} 
                  alt={user.name || user.username} 
                />
                <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                Entrar
              </Button>
            </Link>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="py-4">
                <div className="flex flex-col gap-4 px-2">
                  <Link href="/">
                    <Button variant="ghost" className="w-full justify-start">
                      Início
                    </Button>
                  </Link>
                  <Link href="/categories">
                    <Button variant="ghost" className="w-full justify-start">
                      Categorias
                    </Button>
                  </Link>
                  <Link href="/videoaulas">
                    <Button variant="ghost" className="w-full justify-start">
                      Videoaulas
                    </Button>
                  </Link>
                  <Link href="/comunidade">
                    <Button variant="ghost" className="w-full justify-start">
                      Comunidade
                    </Button>
                  </Link>
                  {user ? (
                    <>
                      <Link href="/painel/inicio">
                        <Button variant="ghost" className="w-full justify-start">
                          Meu Painel
                        </Button>
                      </Link>
                      <Link href="/painel/perfil">
                        <Button variant="ghost" className="w-full justify-start">
                          Meu Perfil
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href="/login">
                      <Button variant="ghost" className="w-full justify-start">
                        Entrar / Cadastrar
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default TopBar;