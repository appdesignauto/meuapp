import { ChevronLeft, Menu } from 'lucide-react';
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
  // Apenas renderiza o botão de voltar quando necessário,
  // sem o cabeçalho completo
  if (showBack) {
    return (
      <div className="pt-2 pl-2">
        <Link href={backPath}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        {children}
      </div>
    );
  }
  
  // Não renderiza nenhum elemento de cabeçalho
  return null;
};

export default TopBar;