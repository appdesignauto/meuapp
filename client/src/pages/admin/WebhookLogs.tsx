import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import WebhookLogList from '../../components/admin/WebhookLogList';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  RefreshCw,
  Database
} from 'lucide-react';

/**
 * Página de administração para visualização de logs de webhook
 * Exibe todos os webhooks recebidos e permite filtrar, buscar e ordenar
 */
export default function WebhookLogsPage() {
  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Gerenciamento de Webhooks | DesignAuto</title>
        <meta name="description" content="Gerencie e monitore webhooks recebidos de integrações como Hotmart e Doppus" />
      </Helmet>
      
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Webhooks</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie webhooks recebidos de integrações externas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link to="/admin">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          
          <Link to="/admin/integracao-hotmart">
            <Button className="flex items-center gap-2">
              <Database className="h-4 w-4" /> Config. Integrações
            </Button>
          </Link>
        </div>
      </div>
      
      <WebhookLogList />
    </div>
  );
}