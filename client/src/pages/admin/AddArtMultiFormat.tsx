import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddArtFormMulti from '@/components/admin/AddArtFormMulti';
import { useToast } from '@/hooks/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const AddArtMultiFormatPage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Verifica se o usuário é admin ou designer_adm
  const isAuthorized = user?.role === 'admin' || user?.role === 'designer_adm';
  
  if (!isAuthorized) {
    // Redireciona para home se não for autorizado
    toast({
      title: "Acesso negado",
      description: "Você não tem permissão para acessar esta página",
      variant: "destructive",
    });
    setLocation('/');
    return null;
  }
  
  const handleSuccess = () => {
    toast({
      title: "Sucesso!",
      description: "Arte multi-formato adicionada com sucesso",
    });
    setLocation('/admin');
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Início</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Painel Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Arte Multi-Formato</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold mt-2">Adicionar Arte Multi-Formato</h1>
          <p className="text-muted-foreground">
            Crie uma arte com múltiplas variações de formato no mesmo grupo
          </p>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setLocation('/admin')}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      <AddArtFormMulti onSuccess={handleSuccess} />
    </div>
  );
};

export default AddArtMultiFormatPage;