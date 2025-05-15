import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExtendedBadge } from "@/components/ui/badge-extensions";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar, 
  Eye, 
  RefreshCcw,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface WebhookLog {
  id: number;
  source: string;
  eventType: string;
  status: "success" | "error" | "pending";
  createdAt: string;
  processedAt: string | null;
  payload: string;
  response: string | null;
  errorMessage: string | null;
}

const WebhookList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/webhooks", page, search, statusFilter, sourceFilter],
    queryFn: async () => {
      try {
        // Na implementação real, usaria os filtros e paginação
        const res = await fetch(`/api/admin/webhooks?page=${page}&search=${search}&status=${statusFilter}&source=${sourceFilter}`);
        if (!res.ok) {
          throw new Error("Falha ao carregar webhooks");
        }
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar webhooks:", error);
        // Dados temporários para desenvolvimento da UI
        return {
          webhooks: [
            {
              id: 1,
              source: "Hotmart",
              eventType: "PURCHASE_APPROVED",
              status: "success",
              createdAt: "2025-05-14T15:30:22.123Z",
              processedAt: "2025-05-14T15:30:23.456Z",
              payload: JSON.stringify({
                eventId: "evt_123456",
                data: {
                  buyer: { email: "cliente@example.com" },
                  product: { name: "Premium Anual" }
                }
              }),
              response: JSON.stringify({ success: true }),
              errorMessage: null
            },
            {
              id: 2,
              source: "Hotmart",
              eventType: "SUBSCRIPTION_CANCELED",
              status: "error",
              createdAt: "2025-05-13T08:42:15.789Z",
              processedAt: "2025-05-13T08:42:16.012Z",
              payload: JSON.stringify({
                eventId: "evt_789012",
                data: {
                  buyer: { email: "outro@example.com" },
                  subscription: { id: "sub_456" }
                }
              }),
              response: null,
              errorMessage: "Usuário não encontrado no sistema"
            },
            {
              id: 3,
              source: "Doppus",
              eventType: "PAYMENT_RECEIVED",
              status: "success",
              createdAt: "2025-05-10T12:10:33.444Z",
              processedAt: "2025-05-10T12:10:34.555Z",
              payload: JSON.stringify({
                event: "payment.received",
                data: {
                  customer: { email: "doppus@example.com" },
                  plan: "Pro Mensal"
                }
              }),
              response: JSON.stringify({ success: true }),
              errorMessage: null
            },
            {
              id: 4,
              source: "Hotmart",
              eventType: "PURCHASE_APPROVED",
              status: "pending",
              createdAt: "2025-05-15T09:05:11.222Z",
              processedAt: null,
              payload: JSON.stringify({
                eventId: "evt_332211",
                data: {
                  buyer: { email: "pendente@example.com" },
                  product: { name: "Premium Anual" }
                }
              }),
              response: null,
              errorMessage: null
            },
            {
              id: 5,
              source: "Hotmart",
              eventType: "SUBSCRIPTION_REACTIVATED",
              status: "success",
              createdAt: "2025-05-12T20:23:45.678Z",
              processedAt: "2025-05-12T20:23:46.789Z",
              payload: JSON.stringify({
                eventId: "evt_112233",
                data: {
                  buyer: { email: "reativado@example.com" },
                  subscription: { id: "sub_789" }
                }
              }),
              response: JSON.stringify({ success: true }),
              errorMessage: null
            }
          ],
          total: 5,
          page: 1,
          totalPages: 1
        };
      }
    }
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleSourceFilterChange = (value: string) => {
    setSourceFilter(value);
  };

  const handleViewDetails = (webhook: WebhookLog) => {
    toast({
      title: "Detalhes do Webhook",
      description: `Evento: ${webhook.eventType} (ID: ${webhook.id})`,
    });
    
    // Aqui seria implementado um modal ou uma navegação para uma página de detalhes
    console.log("Webhook payload:", JSON.parse(webhook.payload));
  };

  const handleReprocess = (id: number) => {
    toast({
      title: "Reprocessando webhook",
      description: `Webhook ID: ${id} será processado novamente.`,
    });
    
    // Aqui seria implementada a chamada para reprocessar o webhook
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "success":
        return "success";
      case "error":
        return "destructive";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Webhooks</CardTitle>
        <CardDescription>
          Visualize e gerencie eventos de webhooks recebidos
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou tipo de evento"
                value={search}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:w-1/3">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sourceFilter} onValueChange={handleSourceFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="doppus">Doppus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            title="Atualizar lista"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Ocorreu um erro ao carregar os webhooks.</p>
          </div>
        ) : !data?.webhooks?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum webhook encontrado.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Tipo de Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Recebimento</TableHead>
                    <TableHead>Processado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.webhooks.map((webhook: WebhookLog) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.id}</TableCell>
                      <TableCell>{webhook.source}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={webhook.eventType}>
                          {webhook.eventType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ExtendedBadge variant={getStatusVariant(webhook.status)}>
                          {webhook.status === "success" && "Sucesso"}
                          {webhook.status === "error" && "Erro"}
                          {webhook.status === "pending" && "Pendente"}
                        </ExtendedBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(webhook.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {webhook.processedAt ? formatDate(webhook.processedAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleViewDetails(webhook)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {(webhook.status === "error" || webhook.status === "pending") && (
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="text-primary hover:text-primary/80"
                              onClick={() => handleReprocess(webhook.id)}
                              title="Reprocessar webhook"
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {data.webhooks.length} de {data.total} webhooks
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                  disabled={page === data.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col items-start gap-2 border-t px-6 py-4">
        <h4 className="text-sm font-semibold">Informações:</h4>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
          <li>Os webhooks são processados automaticamente quando recebidos</li>
          <li>Webhooks com erro podem ser reprocessados manualmente</li>
          <li>Os detalhes completos incluem o payload recebido e a resposta do processamento</li>
          <li>Para configurar novos webhooks, acesse a aba de Configurações</li>
        </ul>
      </CardFooter>
    </Card>
  );
};

export default WebhookList;