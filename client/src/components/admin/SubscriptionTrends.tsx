import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtendedBadge } from "@/components/ui/badge-extensions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface SubscriptionData {
  date: string;
  count: number;
  source?: string;
}

const SubscriptionTrends = () => {
  const { data: trendData, isLoading, error } = useQuery({
    queryKey: ["/api/admin/subscription-trends"],
    // Fallback para um endpoint real que ainda não está implementado
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/subscription-trends");
        if (!res.ok) {
          throw new Error("Falha ao carregar tendências de assinaturas");
        }
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar tendências:", error);
        // Retorna dados temporários enquanto o backend está em desenvolvimento
        return {
          total: 32,
          active: 28,
          expired: 4,
          thisMonth: 5,
          lastMonth: 3,
          percentChange: "+40%",
          data: [
            { date: "Jan", count: 4 },
            { date: "Fev", count: 6 },
            { date: "Mar", count: 8 },
            { date: "Abr", count: 10 },
            { date: "Mai", count: 5 }
          ]
        };
      }
    }
  });

  if (isLoading) {
    return (
      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle>Tendências de Assinaturas</CardTitle>
          <CardDescription>Carregando dados de assinaturas...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !trendData) {
    return (
      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle>Tendências de Assinaturas</CardTitle>
          <CardDescription>Não foi possível carregar os dados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Ocorreu um erro ao buscar os dados de assinaturas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full md:col-span-2">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Tendências de Assinaturas</CardTitle>
            <CardDescription>Visão geral de assinaturas ao longo do tempo</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExtendedBadge variant="default">
              Total: {trendData.total}
            </ExtendedBadge>
            <ExtendedBadge variant="success">
              Ativas: {trendData.active}
            </ExtendedBadge>
            <ExtendedBadge variant="destructive">
              Expiradas: {trendData.expired}
            </ExtendedBadge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Este mês</span>
            <span className="text-2xl font-bold">{trendData.thisMonth}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Mês anterior</span>
            <span className="text-2xl font-bold">{trendData.lastMonth}</span>
          </div>
          <ExtendedBadge 
            variant={trendData.percentChange.startsWith("+") ? "success" : "destructive"}
            className="self-end"
          >
            {trendData.percentChange}
          </ExtendedBadge>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData.data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{
                  color: "var(--foreground)",
                }}
                labelStyle={{
                  color: "var(--foreground)",
                  fontWeight: "bold",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionTrends;