import { ResumoGeralDashboard } from "@/components/admin/ResumoGeralDashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestResumoGeral() {
  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Teste da Nova Conexão Backend-Frontend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página demonstra a nova arquitetura estruturada:
            <br />• API dedicada: <code>/api/dashboard/resumo-geral</code>
            <br />• Hook customizado: <code>useResumoGeral.ts</code>
            <br />• Componentes reutilizáveis: <code>DashboardCard</code> + <code>ResumoGeralDashboard</code>
            <br />• Dados autênticos do banco PostgreSQL
          </p>
        </CardContent>
      </Card>
      
      <ResumoGeralDashboard />
    </div>
  )
}