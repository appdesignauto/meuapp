import { useState } from 'react';
import { useLocation } from 'wouter';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import EmailManagement from '@/components/admin/EmailManagement';

const EmailManagementPage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Verifica se o usuário é admin
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    // Redireciona para dashboard se não for admin
    toast({
      title: "Acesso negado",
      description: "Apenas administradores podem acessar essa página",
      variant: "destructive",
    });
    setLocation('/admin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/admin')}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciamento de Emails</h1>
              <p className="text-gray-600 mt-1">
                Acompanhe, diagnostique e resolva problemas de envio de emails
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Mail className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        
        <EmailManagement />
      </div>
    </div>
  );
};

export default EmailManagementPage;