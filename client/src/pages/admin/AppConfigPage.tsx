/**
 * Página para gerenciamento das configurações do Progressive Web App (PWA)
 * Permite aos administradores personalizar as configurações do PWA
 */

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import AppConfigComponent from '@/components/admin/AppConfigPage';

export default function AppConfigPage() {
  return (
    <AdminLayout>
      <AppConfigComponent />
    </AdminLayout>
  );
}