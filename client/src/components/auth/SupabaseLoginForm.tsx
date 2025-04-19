import { useState } from "react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SupabaseLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithSupabase } = useSupabaseAuth();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await loginWithSupabase(email, password);
      
      // A navegação e feedback será gerenciado pelo hook useSupabaseAuth
    } catch (error: any) {
      // O erro já foi tratado pelo hook, mas podemos adicionar mais feedback aqui
      console.error("Erro de login:", error);
      
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Usuário ainda não está registrado no Supabase. Por favor, use o formulário de registro primeiro.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login com Supabase</CardTitle>
        <CardDescription>
          Faça login com sua conta do Supabase. 
          Se você acabou de se registrar, verifique seu email para confirmação primeiro.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function SupabaseRegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { registerWithSupabase } = useSupabaseAuth();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Email e senha são obrigatórios.",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await registerWithSupabase(email, password, name, username);
      
      // Se o registro foi bem-sucedido, mostrar mensagem adicional
      if (result?.success) {
        toast({
          title: "Registro concluído com sucesso",
          description: "Agora você pode fazer login com suas credenciais.",
          variant: "default",
        });
      }
      
      // A navegação e feedback será gerenciado pelo hook useSupabaseAuth
    } catch (error: any) {
      // Adicionar feedback específico além do tratado pelo hook
      console.error("Erro de registro:", error);
      
      if (error.message?.includes("already registered")) {
        toast({
          variant: "destructive",
          title: "Usuário já existe",
          description: "Este email já está registrado. Tente fazer login.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Cadastro com Supabase</CardTitle>
        <CardDescription>
          Crie uma nova conta usando Supabase. Após o cadastro, você 
          receberá um email de confirmação e depois poderá fazer login.
          (Durante o teste, a confirmação será feita automaticamente)
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <Input
              id="username"
              type="text"
              placeholder="seu_usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Senha</Label>
            <Input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...
              </>
            ) : (
              "Cadastrar"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function SupabasePasswordResetForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { resetPasswordWithSupabase } = useSupabaseAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await resetPasswordWithSupabase(email);
      
      // Feedback e navegação gerenciados pelo hook
    } catch (error) {
      // Erro já tratado pelo hook
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Recuperar Senha</CardTitle>
        <CardDescription>
          Enviaremos instruções para redefinir sua senha
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              "Enviar instruções"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}