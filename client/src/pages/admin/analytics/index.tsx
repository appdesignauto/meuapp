import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import AnalyticsSettings from '@/components/admin/AnalyticsSettings';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AnalyticsPage: React.FC = () => {
  return (
    <AdminLayout title="Configurações de Analytics" backLink="/admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">
              Configure as ferramentas de análise e rastreamento do seu site.
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription className="text-sm">
            Estas configurações afetam como o site rastreia as atividades dos usuários. 
            Certifique-se de que seu site esteja em conformidade com leis de privacidade aplicáveis, 
            como LGPD e GDPR, e de que sua Política de Privacidade reflita o uso dessas tecnologias.
          </AlertDescription>
        </Alert>

        <AnalyticsSettings />
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;