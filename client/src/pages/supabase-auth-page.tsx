import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupabaseLoginForm, SupabaseRegisterForm, SupabasePasswordResetForm } from "@/components/auth/SupabaseAuthComponents";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useLocation } from "wouter";
// Importação do componente Hero
import { HeroSection } from "@/components/hero/HeroSection";
import { Loader2 } from "lucide-react";

export default function SupabaseAuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { user, isLoading } = useSupabaseAuth();
  const [_, setLocation] = useLocation();
  
  useEffect(() => {
    // Se já estiver autenticado, redirecionar para a página inicial
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);
  
  // Determinar o tab inicial com base no hash da URL
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "login" || hash === "register" || hash === "reset") {
      setActiveTab(hash);
    }
  }, []);
  
  // Atualizar hash quando o tab mudar
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Se já estiver autenticado, não renderizar nada (o efeito fará o redirecionamento)
  if (user) {
    return null;
  }
  
  return (
    <div className="container py-8 min-h-screen">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold mb-2">Bem-vindo ao DesignAuto</h1>
            <p className="text-muted-foreground max-w-md mx-auto lg:mx-0">
              Acesse ou crie sua conta para ter acesso a milhares de designs automotivos exclusivos para o seu negócio.
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-md mx-auto lg:mx-0">
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
        </div>
        
        <div className="hidden lg:block lg:relative">
          <div className="rounded-lg overflow-hidden shadow-xl">
            <HeroSection />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 max-w-xs p-4 bg-background/90 rounded-lg shadow-lg z-10">
            <h3 className="text-lg font-bold mb-1">DesignAuto Premium</h3>
            <p className="text-sm text-muted-foreground">
              Acesso ilimitado a mais de 3.000 designs de alta qualidade para o seu negócio automotivo. 
              Crie, edite e baixe quando quiser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}