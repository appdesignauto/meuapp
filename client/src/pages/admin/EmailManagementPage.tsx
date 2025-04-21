import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import EmailManagement from "@/components/admin/EmailManagement";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailManagementPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Verificar se é admin
  if (user?.role !== 'admin') {
    toast({
      title: "Acesso negado",
      description: "Você não tem permissão para acessar esta página",
      variant: "destructive",
    });
    setLocation('/');
    return null;
  }

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-2"
          onClick={() => setLocation('/admin/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Gerenciamento de Emails</h1>
      </div>
      
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Esta página contém ferramentas para diagnóstico e gerenciamento de emails da plataforma.
          Consulte logs, verifique status de emails e realize testes de entregabilidade.
        </p>
        
        <EmailManagement />
      </div>
    </div>
  );
}