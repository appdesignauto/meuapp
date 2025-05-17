import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

type WebhookLog = {
  id: number;
  status: string;
  eventType: string;
  source: string;
  createdAt: string;
  payloadData: any;
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
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Método de pesquisa direta
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
      
      // Usando a tabela diretamente para uma busca rápida
      const response = await fetch(`/api/webhooks/search?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Resultados da busca:", data);
      
      // Processar os resultados para extrair emails
      const processedResults = data.logs.map((log: WebhookLog) => {
        let foundEmail = null;
        let emailLocation = null;
        
        try {
          const payload = typeof log.payloadData === 'string' 
            ? JSON.parse(log.payloadData) 
            : log.payloadData;
          
          // Buscar em diferentes locais dependendo da origem
          if (log.source === 'hotmart') {
            foundEmail = payload.data?.buyer?.email || null;
            emailLocation = foundEmail ? 'data.buyer.email' : null;
          } else if (log.source === 'doppus') {
            foundEmail = payload.data?.customer?.email || payload.customer?.email || null;
            emailLocation = foundEmail ? (payload.data?.customer?.email ? 'data.customer.email' : 'customer.email') : null;
          }
          
          // Se ainda não encontrou o email, verificar se está no texto serializado
          if (!foundEmail) {
            const payloadStr = JSON.stringify(payload).toLowerCase();
            if (payloadStr.includes(email.toLowerCase())) {
              foundEmail = email;
              emailLocation = 'json_serialized';
            }
          }
        } catch (e) {
          console.error(`Erro ao analisar payload do log ${log.id}:`, e);
        }
        
        return {
          ...log,
          extractedEmail: foundEmail,
          emailLocation,
          matchType: foundEmail ? 'direct_match' : 'text_match'
        };
      });
      
      setSearchResults({
        success: true,
        count: processedResults.length,
        results: processedResults
      });
    } catch (err) {
      console.error("Erro na busca:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast({
        title: "Erro na busca",
        description: err instanceof Error ? err.message : "Ocorreu um erro na busca de webhooks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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