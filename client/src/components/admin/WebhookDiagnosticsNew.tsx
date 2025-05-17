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

export default function WebhookDiagnosticsTab() {
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
      
      // Processamento do webhook para extrair informações para exibição
      const processedLogs = data.logs.map((log: WebhookLog) => {
        try {
          // Se o payloadData for uma string, tenta parseá-lo para objeto
          if (typeof log.payloadData === 'string') {
            const parsedData = JSON.parse(log.payloadData);
            
            // Extrair email dependendo da origem do webhook
            let extractedEmail = null;
            
            if (log.source === 'hotmart') {
              extractedEmail = parsedData.data?.buyer?.email;
            } else if (log.source === 'doppus') {
              extractedEmail = parsedData.data?.customer?.email || parsedData.customer?.email;
            }
            
            return {
              ...log,
              parsedPayload: parsedData,
              extractedEmail
            };
          }
          
          return log;
        } catch (e) {
          console.error(`Erro ao processar log ${log.id}:`, e);
          return log;
        }
      });
      
      setSearchResults({
        success: true,
        count: data.count,
        logs: processedLogs
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
  
  // Componente para renderizar cada webhook log
  const WebhookLogCard = ({ log }: { log: any }) => {
    const [showPayload, setShowPayload] = useState(false);
    
    let payloadPreview = '';
    try {
      if (typeof log.payloadData === 'string') {
        const parsed = JSON.parse(log.payloadData);
        payloadPreview = JSON.stringify(parsed, null, 2).substring(0, 150) + '...';
      } else {
        payloadPreview = JSON.stringify(log.payloadData, null, 2).substring(0, 150) + '...';
      }
    } catch (e) {
      payloadPreview = 'Erro ao processar payload';
    }
    
    return (
      <Card key={log.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base font-medium flex items-center">
                Log #{log.id}
                <Badge variant={log.status === 'processed' ? 'default' : log.status === 'received' ? 'outline' : 'destructive'} className="ml-2">
                  {log.status}
                </Badge>
                <Badge variant="outline" className="ml-2">{log.source}</Badge>
              </CardTitle>
              <CardDescription>
                {formatDate(log.createdAt)}
              </CardDescription>
            </div>
            <Badge variant="secondary">{log.eventType}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {log.extractedEmail && (
            <div className="mb-2">
              <Badge variant="outline" className="bg-yellow-50">{log.extractedEmail}</Badge>
            </div>
          )}
          
          <div className="mt-2 space-y-2">
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Ver payload</summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded-md overflow-auto max-h-60 text-xs">
                {payloadPreview}
              </pre>
            </details>
            
            <Button variant="outline" size="sm" asChild>
              <a href={`/admin/webhooks?id=${log.id}`} target="_blank" rel="noopener noreferrer">
                Ver detalhes
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnóstico Avançado de Webhook</CardTitle>
        <CardDescription>
          Esta ferramenta permite encontrar registros de webhook relacionados a um email específico.
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
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Erro na busca</h4>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
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
                    Hotmart ({searchResults.logs.filter(r => r.source === 'hotmart').length})
                  </TabsTrigger>
                  <TabsTrigger value="doppus">
                    Doppus ({searchResults.logs.filter(r => r.source === 'doppus').length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <div className="space-y-4">
                    {searchResults.logs.map((log) => (
                      <WebhookLogCard key={log.id} log={log} />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="hotmart">
                  <div className="space-y-4">
                    {searchResults.logs
                      .filter(r => r.source === 'hotmart')
                      .map((log) => (
                        <WebhookLogCard key={log.id} log={log} />
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="doppus">
                  <div className="space-y-4">
                    {searchResults.logs
                      .filter(r => r.source === 'doppus')
                      .map((log) => (
                        <WebhookLogCard key={log.id} log={log} />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>Nenhum webhook encontrado com o email: <strong>{email}</strong></p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}