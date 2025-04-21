import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import EmailManagement from "@/components/admin/EmailManagement";
import SpecialEmailHandler from "@/components/admin/SpecialEmailHandler";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Gerenciamento Geral</TabsTrigger>
            <TabsTrigger 
              value="special-cases" 
              className="flex items-center"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Casos Especiais
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="pt-4">
            <EmailManagement />
          </TabsContent>
          
          <TabsContent value="special-cases" className="pt-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Tratamento de Casos Especiais</h2>
              <p className="text-sm text-muted-foreground">
                Esta seção é dedicada ao tratamento de casos especiais de verificação de email,
                destinada a usuários com dificuldades comprovadas em receber emails de verificação.
              </p>
            </div>
            <SpecialEmailHandler 
              onVerificationComplete={() => {
                toast({
                  title: "Verificação concluída",
                  description: "O usuário já pode acessar a plataforma normalmente",
                  variant: "default",
                });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}