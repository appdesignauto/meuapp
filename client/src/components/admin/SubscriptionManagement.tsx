import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  RotateCcw,
  ExternalLink
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ExtendedBadge } from "@/components/ui/badge-extensions";

interface SubscriptionData {
  id: number;
  userId: number;
  username: string;
  email: string;
  source: string;
  plan: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isLifetime: boolean;
  notes: string | null;
}

const SubscriptionManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/subscriptions", page, search, statusFilter, sourceFilter],
    // Fallback para um endpoint real
    queryFn: async () => {
      try {
        // Na implementação real, usaria os filtros e paginação
        const res = await fetch(`/api/admin/subscriptions?page=${page}&search=${search}&status=${statusFilter}&source=${sourceFilter}`);
        if (!res.ok) {
          throw new Error("Falha ao carregar assinaturas");
        }
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar assinaturas:", error);
        // Dados temporários para desenvolvimento da UI
        return {
          subscriptions: [
            {
              id: 1,
              userId: 101,
              username: "carlossilva",
              email: "carlos@example.com",
              source: "Hotmart",
              plan: "Premium Anual",
              startDate: "2025-01-15T00:00:00.000Z",
              endDate: "2026-01-15T00:00:00.000Z",
              isActive: true,
              isLifetime: false,
              notes: null
            },
            {
              id: 2,
              userId: 102,
              username: "mariasantos",
              email: "maria@example.com",
              source: "Manual",
              plan: "Pro Mensal",
              startDate: "2025-03-21T00:00:00.000Z",
              endDate: "2025-06-21T00:00:00.000Z",
              isActive: true,
              isLifetime: false,
              notes: "Oferta especial de lançamento"
            },
            {
              id: 3,
              userId: 103,
              username: "joaoferreira",
              email: "joao@example.com",
              source: "Hotmart",
              plan: "Premium Anual",
              startDate: "2024-11-05T00:00:00.000Z",
              endDate: "2025-03-05T00:00:00.000Z",
              isActive: false,
              isLifetime: false,
              notes: null
            },
            {
              id: 4,
              userId: 104,
              username: "anamartins",
              email: "ana@example.com",
              source: "Doppus",
              plan: "Vitalício",
              startDate: "2025-02-10T00:00:00.000Z",
              endDate: null,
              isActive: true,
              isLifetime: true,
              notes: "Cliente VIP"
            },
            {
              id: 5,
              userId: 105,
              username: "lucasrodrigues",
              email: "lucas@example.com",
              source: "Hotmart",
              plan: "Premium Mensal",
              startDate: "2025-04-18T00:00:00.000Z",
              endDate: "2025-05-18T00:00:00.000Z",
              isActive: true,
              isLifetime: false,
              notes: null
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

  const handleEdit = (id: number) => {
    toast({
      title: "Editar assinatura",
      description: `Editando assinatura ID: ${id}`,
    });
  };

  const handleDelete = (id: number) => {
    toast({
      title: "Excluir assinatura",
      description: `Excluindo assinatura ID: ${id}`,
      variant: "destructive"
    });
  };

  const handleRenew = (id: number) => {
    toast({
      title: "Renovar assinatura",
      description: `Renovando assinatura ID: ${id}`,
      variant: "success"
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Gerenciamento de Assinaturas</CardTitle>
        <CardDescription>
          Visualize, edite ou remova assinaturas de usuários
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário, email ou ID"
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
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
                <SelectItem value="lifetime">Vitalícias</SelectItem>
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
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Ocorreu um erro ao carregar as assinaturas.
          </div>
        ) : !data?.subscriptions?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma assinatura encontrada.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Término</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.subscriptions.map((subscription: SubscriptionData) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{subscription.username}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{subscription.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{subscription.plan}</div>
                      </TableCell>
                      <TableCell>
                        <ExtendedBadge 
                          variant={
                            subscription.source === "Hotmart" ? "default" : 
                            subscription.source === "Manual" ? "secondary" : 
                            "outline"
                          }
                        >
                          {subscription.source}
                        </ExtendedBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(subscription.startDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {subscription.isLifetime ? (
                            <span className="italic">Vitalício</span>
                          ) : (
                            <span>{formatDate(subscription.endDate)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {subscription.isActive ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Ativa</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span>Expirada</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEdit(subscription.id)}
                            title="Editar assinatura"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {!subscription.isActive && (
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleRenew(subscription.id)}
                              title="Renovar assinatura"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(subscription.id)}
                            title="Excluir assinatura"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="icon"
                            asChild
                          >
                            <a 
                              href={`/admin/users/${subscription.userId}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Ver perfil do usuário"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
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
                Mostrando {data.subscriptions.length} de {data.total} assinaturas
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
    </Card>
  );
};

export default SubscriptionManagement;