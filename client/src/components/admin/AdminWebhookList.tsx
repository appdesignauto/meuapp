/**
 * Componente wrapper para WebhookList
 * 
 * Este componente é utilizado para envolver o WebhookList quando é renderizado
 * diretamente na página de Assinaturas acessada pelo botão Admin do cabeçalho.
 */

import React from 'react';
import WebhookList from './WebhookList';

const AdminWebhookList: React.FC = () => {
  // Wrapper simples para o componente WebhookList
  return <WebhookList />;
};

export default AdminWebhookList;