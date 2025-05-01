import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Home } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import SimpleFormMulti from '@/components/admin/SimpleFormMulti';
import { Button } from '@/components/ui/button';

export default function AddArtMultiFormatPage() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verificar se o usuário está autenticado e é admin ou designer_adm
  if (!user || (user.nivelacesso !== 'admin' && user.nivelacesso !== 'designer_adm')) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <header className="bg-white shadow-sm py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Adicionar Arte com Múltiplos Formatos</h1>
            <div className="flex items-center space-x-2">
              <Link href="/admin">
                <Button variant="outline" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Voltar para o Painel
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <SimpleFormMulti />
        </main>
      </div>
    </div>
  );
}