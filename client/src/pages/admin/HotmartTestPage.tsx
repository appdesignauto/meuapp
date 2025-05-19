import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import HotmartCredentialTester from '@/components/admin/HotmartCredentialTester';

export default function HotmartTestPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Testador de Credenciais Hotmart</h2>
          <p className="text-muted-foreground">
            Verifique se suas credenciais da API Hotmart estão funcionando corretamente
          </p>
        </div>
        
        <div className="grid gap-6">
          <HotmartCredentialTester />
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
            <h3 className="text-lg font-medium text-amber-800 mb-2">Dicas para solução de problemas</h3>
            <ul className="space-y-2 text-amber-700">
              <li>• Se suas credenciais não funcionarem, verifique se elas estão ativas no painel da Hotmart.</li>
              <li>• Certifique-se de que o Client ID e Client Secret estão corretos e sem espaços extras.</li>
              <li>• Verifique se as credenciais têm as permissões necessárias para acessar os recursos que você precisa.</li>
              <li>• Se você estiver usando o ambiente de produção, certifique-se de que sua aplicação já foi aprovada.</li>
              <li>• Experimente testar no ambiente de sandbox primeiro para confirmar que a conexão está funcionando.</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}