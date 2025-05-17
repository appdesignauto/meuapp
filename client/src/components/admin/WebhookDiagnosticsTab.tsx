import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getQueryFn } from "@/lib/queryClient";

type WebhookLog = {
  id: number;
  status: string;
  eventType: string;
  source: string;
  createdAt: string;
  extractedEmail?: string;
  emailLocation?: string;
  matchType?: string;
};

type SearchResult = {
  success: boolean;
  count: number;
  results: WebhookLog[];
};

export default function WebhookDiagnosticsTab() {
  const [email, setEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const {
    data: searchResults,
    isLoading,
    refetch
  } = useQuery<SearchResult>({
    queryKey: ['/api/webhook-diagnostics/advanced-search', searchTerm],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!searchTerm,
  });
  
  const handleSearch = () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe um email para pesquisar.",
        variant: "destructive",
      });
      return;
    }
    
    setSearchTerm(`?email=${encodeURIComponent(email)}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnóstico Avançado de Webhook</CardTitle>
        <CardDescription>
          Esta ferramenta permite encontrar registros de webhook mesmo quando o email está em campos aninhados no JSON.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Email para buscar (ex: cliente@exemplo.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </>
            )}
          </Button>
        </div>
        
        {searchResults && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Resultados da Busca</h3>
              <div className="text-sm text-muted-foreground">
                {searchResults.count > 0
                  ? `Encontrados ${searchResults.count} registros de webhook.`
                  : "Nenhum webhook encontrado com este email."}
              </div>
            </div>
            
            {searchResults.count > 0 ? (
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Todos ({searchResults.count})</TabsTrigger>
                  <TabsTrigger value="hotmart">
                    Hotmart ({searchResults.results.filter(r => r.source === 'hotmart').length})
                  </TabsTrigger>
                  <TabsTrigger value="doppus">
                    Doppus ({searchResults.results.filter(r => r.source === 'doppus').length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  {renderResults(searchResults.results)}
                </TabsContent>
                
                <TabsContent value="hotmart">
                  {renderResults(searchResults.results.filter(r => r.source === 'hotmart'))}
                </TabsContent>
                
                <TabsContent value="doppus">
                  {renderResults(searchResults.results.filter(r => r.source === 'doppus'))}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <>
                    <div className="mb-4">Nenhum webhook encontrado com este email.</div>
                    <div className="text-sm">
                      Possíveis razões:
                      <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                        <li>O webhook não foi recebido pelo servidor</li>
                        <li>O email está em um formato diferente do esperado</li>
                        <li>Há uma configuração incorreta no endpoint de webhook</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div>Utilize o campo de busca acima para encontrar webhooks por email.</div>
                )}
              </div>
            )}

            {searchResults.count > 0 && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => refetch()}>Atualizar Resultados</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  function renderResults(results: WebhookLog[]) {
    return results.length > 0 ? (
      <div className="space-y-4">
        {results.map((log) => (
          <div key={log.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-lg">
                  #{log.id} - {log.eventType}
                </h3>
                <div className="text-sm text-muted-foreground">
                  {formatDate(log.createdAt)}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge 
                  variant={
                    log.status === 'processed' 
                      ? 'default' 
                      : log.status === 'error' 
                        ? 'destructive' 
                        : 'secondary'
                  }
                >
                  {log.status}
                </Badge>
                <Badge variant={log.source === 'hotmart' ? 'default' : 'outline'}>
                  {log.source}
                </Badge>
              </div>
            </div>
            
            {log.extractedEmail && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Email encontrado:</span>{" "}
                <span className="text-primary">{log.extractedEmail}</span>
                {log.emailLocation && (
                  <>
                    {" "}
                    <span className="text-muted-foreground">
                      (localizado em: {log.emailLocation})
                    </span>
                  </>
                )}
              </div>
            )}
            
            <div className="mt-2">
              <Button variant="link" size="sm" asChild>
                <a href={`/admin/webhooks/details/${log.id}`} target="_blank" rel="noopener noreferrer">
                  Ver Detalhes Completos
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum webhook encontrado nesta categoria.
      </div>
    );
  }
}