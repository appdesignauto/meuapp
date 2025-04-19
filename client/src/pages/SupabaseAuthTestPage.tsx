import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupabaseLoginForm, SupabaseRegisterForm, SupabasePasswordResetForm } from "@/components/auth/SupabaseLoginForm";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";

export default function SupabaseAuthTestPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { session, logoutWithSupabase } = useSupabaseAuth();

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Teste de Autenticação com Supabase</h1>
          <p className="text-muted-foreground">
            Esta página permite testar a integração da autenticação com Supabase.
          </p>
        </div>

        {session ? (
          <div className="bg-card p-6 rounded-lg border mb-8">
            <h2 className="text-xl font-semibold mb-4">Usuário Autenticado</h2>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
              <Button variant="destructive" onClick={logoutWithSupabase}>
                Sair
              </Button>
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
        
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Informações Técnicas</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Status da Sessão:</span>{" "}
              {session ? "Autenticado" : "Não Autenticado"}
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