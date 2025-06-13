import { useResumoGeral } from "@/hooks/useResumoGeral"
import { DashboardCard } from "./DashboardCard"
import { DollarSign, Users, TrendingUp, Target, BarChart3, Download } from "lucide-react"

export function ResumoGeralDashboard() {
  const { dados, loading, error } = useResumoGeral()

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Erro ao carregar dados: {error.message}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Faturamento Total"
        value={`R$ ${dados?.faturamento?.toFixed(2) || '0,00'}`}
        icon={DollarSign}
        loading={loading}
        description="Receita total das assinaturas"
      />
      
      <DashboardCard
        title="Assinantes Ativos"
        value={dados?.assinantes || 0}
        icon={Users}
        loading={loading}
        description="Usuários premium e designer"
      />
      
      <DashboardCard
        title="Taxa de Conversão"
        value={`${dados?.taxaConversao || 0}%`}
        icon={TrendingUp}
        loading={loading}
        description="Conversão de usuários gratuitos para premium"
      />
      
      <DashboardCard
        title="Ticket Médio"
        value={`R$ ${dados?.ticketMedio?.toFixed(2) || '0,00'}`}
        icon={Target}
        loading={loading}
        description="Valor médio por assinatura"
      />
      
      <DashboardCard
        title="Total de Usuários"
        value={dados?.usuariosTotais || 0}
        icon={Users}
        loading={loading}
        description={`${dados?.usuariosGratuitos || 0} gratuitos + ${dados?.usuariosPremium || 0} premium`}
      />
      
      <DashboardCard
        title="Artes Disponíveis"
        value={dados?.artesTotais || 0}
        icon={BarChart3}
        loading={loading}
        description="Designs disponíveis na plataforma"
      />
      
      <DashboardCard
        title="Posts da Comunidade"
        value={dados?.postsTotais || 0}
        icon={BarChart3}
        loading={loading}
        description="Publicações dos usuários"
      />
      
      <DashboardCard
        title="Downloads Totais"
        value={dados?.downloadsTotais || 0}
        icon={Download}
        loading={loading}
        description="Total de downloads realizados"
      />
    </div>
  )
}