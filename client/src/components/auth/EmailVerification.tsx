import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, ArrowRight, Loader2 } from "lucide-react";

export function EmailVerificationForm() {
  const { verifyEmailMutation, resendVerificationMutation, user } = useAuth();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length < 4) {
      toast({
        title: "Código inválido",
        description: "Por favor, insira o código de verificação completo.",
        variant: "destructive",
      });
      return;
    }
    
    verifyEmailMutation.mutate({ code: verificationCode });
  };
  
  const handleResend = () => {
    resendVerificationMutation.mutate();
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Verificação de E-mail</CardTitle>
        <CardDescription>
          Enviamos um código de verificação para {user?.email}. 
          Por favor, insira o código abaixo para verificar sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verificationCode">Código de Verificação</Label>
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground" size={20} />
              <Input
                id="verificationCode"
                placeholder="Digite o código recebido no e-mail"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="flex-1"
                autoComplete="one-time-code"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={verifyEmailMutation.isPending}
          >
            {verifyEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Verificar Conta
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleResend}
          disabled={resendVerificationMutation.isPending}
        >
          {resendVerificationMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reenviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Reenviar Código
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function EmailVerificationPage() {
  return (
    <div className="container py-10 flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">DesignAuto</h1>
          <p className="text-muted-foreground mt-2">
            Estamos quase lá! Precisamos verificar seu e-mail para ativar sua conta.
          </p>
        </div>
        
        <EmailVerificationForm />
      </div>
    </div>
  );
}