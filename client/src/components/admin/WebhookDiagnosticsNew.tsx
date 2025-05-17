import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type WebhookLog = {
  id: number;
  status: string;
  eventType: string;
  source: string;
  createdAt: string;
  payloadData: string;
};

type SearchResult = {
  success: boolean;
  count: number;
  logs: WebhookLog[];
};

export default function WebhookDiagnosticsNew() {
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleSearch = async () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe um email para pesquisar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Buscando webhooks relacionados a: ${email}`);
      
      // Fazer a requisição para a API de busca
      const response = await fetch(`/api/webhooks/search?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Resultados da busca:", data);
      
      setSearchResults(data);
    } catch (err) {
      console.error("Erro na busca:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      
      toast({
        title: "Erro na pesquisa",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao buscar os webhooks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Diagnóstico Avançado de Webhooks</CardTitle>
          <CardDescription>
            Pesquise por email para encontrar todos os webhooks relacionados a um usuário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Email do usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="min-w-24"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                "Pesquisar"
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 p-4 rounded-md mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Erro na pesquisa</h4>
                  <p className="text-sm text-destructive/90">{error}</p>
                </div>
              </div>
            </div>
          )}

          {searchResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Resultados da pesquisa</h3>
                <Badge variant="outline">
                  {searchResults.count} webhook{searchResults.count !== 1 ? 's' : ''} encontrado{searchResults.count !== 1 ? 's' : ''}
                </Badge>
              </div>

              {searchResults.count === 0 ? (
                <div className="bg-muted/50 p-6 rounded-md text-center">
                  <p className="text-muted-foreground">Nenhum webhook encontrado para este email.</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Origem</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.logs.map((log) => (
                          <tr key={log.id} className="border-t">
                            <td className="px-4 py-3 text-sm">{log.id}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="outline" className="font-normal">
                                {log.eventType}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge 
                                variant={log.status === 'success' ? 'success' : log.status === 'error' ? 'destructive' : 'default'} 
                                className="font-normal"
                              >
                                {log.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge 
                                variant="outline" 
                                className="font-normal"
                              >
                                {log.source || 'N/A'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}