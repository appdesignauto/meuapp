import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Home, Plus } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import SimpleFormMultiDialog from '@/components/admin/SimpleFormMultiDialog';
import { Button } from '@/components/ui/button';

export default function AddArtMultiFormatPage() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 mr-2"
              >
                <Plus className="h-4 w-4" />
                Nova Arte Multi-Formato
              </Button>
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
          <div className="mb-6 p-8 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Criação de Artes Multi-Formato</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Crie uma arte com variações para diferentes formatos (Feed, Stories, etc.) 
              com um único upload. Isso facilita a organização e descoberta das artes relacionadas.
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Nova Arte Multi-Formato
            </Button>
          </div>
          
          <SimpleFormMultiDialog 
            isOpen={isDialogOpen} 
            onClose={() => setIsDialogOpen(false)} 
          />
        </main>
      </div>
    </div>
  );
}