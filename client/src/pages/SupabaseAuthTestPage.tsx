import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupabaseLoginForm, SupabaseRegisterForm, SupabasePasswordResetForm } from "@/components/auth/SupabaseAuthComponents";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SupabaseAuthTestPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { user, logout, getSession } = useSupabaseAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const { toast } = useToast();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  
  const handleConfirmEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmEmail) {
      toast({
        variant: "destructive",
        title: "Email obrigatório",
        description: "Por favor, informe o email que deseja confirmar."
      });
      return;
    }
    
    setIsConfirming(true);
    
    try {
      const response = await fetch("/api/auth/supabase/confirm-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: confirmEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Não foi possível confirmar o email");
      }
      
      toast({
        title: "Email confirmado",
        description: "Email confirmado com sucesso! Agora você pode fazer login.",
        variant: "default"
      });
      
      // Limpar o campo após o sucesso
      setConfirmEmail("");
    } catch (error: any) {
      console.error("Erro ao confirmar email:", error);
      toast({
        variant: "destructive",
        title: "Erro na confirmação",
        description: error.message || "Ocorreu um erro ao tentar confirmar o email"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Teste de Autenticação com Supabase</h1>
          <p className="text-muted-foreground">
            Esta página permite testar a integração da autenticação com Supabase.
          </p>
        </div>

        {user ? (
          <div className="bg-card p-6 rounded-lg border mb-8">
            <h2 className="text-xl font-semibold mb-4">Usuário Autenticado</h2>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    try {
                      await logout();
                      setSessionData(null);
                    } catch (err) {
                      console.error("Erro ao fazer logout:", err);
                    }
                  }}
                >
                  Sair
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const { session } = await getSession();
                      setSessionData(session);
                    } catch (err) {
                      console.error("Erro ao obter sessão:", err);
                    }
                  }}
                >
                  Verificar Sessão Supabase
                </Button>
              </div>
              
              {sessionData && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Dados da Sessão Supabase:</h3>
                  <div className="p-4 bg-muted rounded-md overflow-auto">
                    <pre className="text-sm">
                      {JSON.stringify(sessionData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
              <TabsTrigger value="reset">Recuperar Senha</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <SupabaseLoginForm />
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <SupabaseRegisterForm />
            </TabsContent>
            <TabsContent value="reset" className="mt-6">
              <SupabasePasswordResetForm />
            </TabsContent>
          </Tabs>
        )}
        
        {/* Ferramenta de confirmação de email */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Ferramenta de Confirmação de Email</h2>
          <Card>
            <CardHeader>
              <CardTitle>Confirmar Email Manualmente</CardTitle>
              <CardDescription>
                Use essa ferramenta para confirmar manualmente o email de um usuário durante os testes.
                Isso permite fazer login mesmo sem ter acesso à caixa de entrada.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleConfirmEmail}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirm-email">Email para confirmar</Label>
                  <Input
                    id="confirm-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    disabled={isConfirming}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isConfirming}>
                  {isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...
                    </>
                  ) : (
                    "Confirmar Email"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Informações Técnicas</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Status da Sessão:</span>{" "}
              {user ? "Autenticado" : "Não Autenticado"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Implementação:</span> Autenticação híbrida usando Supabase Auth + autenticação local
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}