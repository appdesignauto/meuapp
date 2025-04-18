import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SimpleLogo from '@/components/admin/SimpleLogo';

const LogoUploadPage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Verificar se o usuário é admin
  const isAuthorized = user?.role === 'admin' || user?.role === 'designer_adm';

  if (!isAuthorized) {
    // Redirecionar para home se não for autorizado
    toast({
      title: "Acesso negado",
      description: "Você não tem permissão para acessar esta página",
      variant: "destructive",
    });
    setLocation('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Upload de Logo</h1>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/admin')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Painel
          </Button>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <SimpleLogo />
          </div>
        </div>

        <div className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Instruções</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Selecione uma imagem para usar como logo do site.</li>
              <li>Formatos recomendados: PNG, SVG ou WebP com fundo transparente.</li>
              <li>Tamanho ideal: altura de 40-60px, largura proporcional.</li>
              <li>Tamanho máximo do arquivo: 2MB.</li>
              <li>Após o upload, a página será recarregada para aplicar as mudanças.</li>
              <li>Se o logo não aparecer imediatamente no cabeçalho, tente limpar o cache do navegador ou recarregar a página.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoUploadPage;