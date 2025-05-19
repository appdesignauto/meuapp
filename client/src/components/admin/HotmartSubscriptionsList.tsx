import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para assinaturas Hotmart
interface HotmartSubscriber {
  name: string;
  email: string;
  phone: string;
}

interface HotmartPrice {
  value: number;
  currency: string;
}

interface HotmartRecurrence {
  frequency: string;
  cycle: number;
}

interface HotmartSubscription {
  id: string;
  status: string;
  plan: string;
  productName: string;
  productId: string;
  subscriber: HotmartSubscriber;
  startDate: string;
  endDate: string;
  trial: boolean;
  price: HotmartPrice;
  recurrence: HotmartRecurrence;
  cancellationDate?: string;
  cancellationReason?: string;
}

interface HotmartResponse {
  success: boolean;
  message: string;
  data: {
    subscriptions: HotmartSubscription[];
    count: number;
    hasNextPage: boolean;
  };
}

const HotmartSubscriptionsList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<HotmartSubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Função para formatar status
  const formatStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'Ativa';
      case 'CANCELLED':
        return 'Cancelada';
      case 'INACTIVE':
        return 'Inativa';
      case 'DELAYED_PAYMENT':
        return 'Pagamento Atrasado';
      case 'TRIAL':
        return 'Período de Teste';
      default:
        return status;
    }
  };

  // Função para obter cor do badge baseado no status
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'CANCELLED':
        return 'bg-red-500';
      case 'INACTIVE':
        return 'bg-gray-500';
      case 'DELAYED_PAYMENT':
        return 'bg-yellow-500';
      case 'TRIAL':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Função para formatar frequência de recorrência
  const formatFrequency = (frequency: string) => {
    switch (frequency.toUpperCase()) {
      case 'YEARLY':
        return 'Anual';
      case 'MONTHLY':
        return 'Mensal';
      case 'QUARTERLY':
        return 'Trimestral';
      case 'SEMIANNUAL':
        return 'Semestral';
      case 'BIENNIAL':
        return 'Bienal';
      default:
        return frequency;
    }
  };

  // Função para formatar valor com moeda
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(value);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para buscar as assinaturas da Hotmart
  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hotmart-subscriptions/list');
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar assinaturas: ${response.statusText}`);
      }
      
      const data: HotmartResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Falha ao obter assinaturas');
      }
      
      setSubscriptions(data.data.subscriptions);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar assinaturas');
      console.error('Erro ao buscar assinaturas Hotmart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar assinaturas ao montar o componente
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Assinaturas Hotmart</CardTitle>
          <CardDescription>
            Lista todas as assinaturas ativas e recentes na plataforma Hotmart.
            {lastUpdated && (
              <span className="block text-xs mt-1">
                Última atualização: {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}
              </span>
            )}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchSubscriptions}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            <p className="font-medium">Erro ao carregar assinaturas</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando assinaturas...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>Nenhuma assinatura encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Assinante</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Recorrência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-mono text-xs">
                      {subscription.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{subscription.subscriber.name}</div>
                      <div className="text-xs text-gray-500">{subscription.subscriber.email}</div>
                    </TableCell>
                    <TableCell>
                      <div>{subscription.productName}</div>
                      <div className="text-xs text-gray-500">ID: {subscription.productId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(subscription.status)}>
                        {formatStatus(subscription.status)}
                      </Badge>
                      {subscription.cancellationDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Cancelado em: {formatDate(subscription.cancellationDate)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(subscription.startDate)}</TableCell>
                    <TableCell>{formatDate(subscription.endDate)}</TableCell>
                    <TableCell>
                      {formatCurrency(subscription.price.value, subscription.price.currency)}
                    </TableCell>
                    <TableCell>
                      {formatFrequency(subscription.recurrence.frequency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HotmartSubscriptionsList;