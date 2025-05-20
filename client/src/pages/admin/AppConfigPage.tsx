/**
 * Página para gerenciamento das configurações do Progressive Web App (PWA)
 * Permite aos administradores personalizar as configurações do PWA
 */

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import AppConfigPageComponent from '@/components/admin/AppConfigPage';

export default function AppConfigPage() {
  return (
    <AdminLayout title="Configurações do PWA" backLink="/admin">
      <AppConfigPageComponent />
    </AdminLayout>
  );
}