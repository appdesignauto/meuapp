import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Verificação se estamos em modo de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

export function EmailVerificationModal() {
  // MODO DESENVOLVIMENTO: Não mostrar o modal durante o desenvolvimento para evitar loops de renderização
  if (isDevelopment) {
    return null;
  }

  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Verificar se deve mostrar o modal (usuário logado com email não confirmado)
  useEffect(() => {
    if (!isLoading && user && user.emailconfirmed === false) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [user, isLoading]);

  // Obter o status atual da verificação
  const { data: verificationStatus, refetch: refetchVerificationStatus } = useQuery({
    queryKey: ["/api/email-verification/status"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/email-verification/status");
        return response.json();
      } catch (error) {
        console.error("Erro ao buscar status da verificação:", error);
        return { success: false, sent: false };
      }
    },
    enabled: !!user && user.emailconfirmed === false,
    refetchOnWindowFocus: false,
  });

  // Mutação para verificar o código
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/email-verification/verify", { code });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Email verificado com sucesso!",
          description: "Agora você tem acesso completo à plataforma.",
          variant: "default",
        });
        
        // Recarregar a página para atualizar os dados do usuário
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: "Falha na verificação",
          description: data.message || "Código inválido ou expirado. Tente novamente.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro no servidor",
        description: "Ocorreu um erro ao verificar seu código. Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Mutação para reenviar o código
  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/email-verification/resend");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Código reenviado!",
          description: "Um novo código de verificação foi enviado para seu e-mail.",
          variant: "default",
        });
        
        // Atualiza o status da verificação
        refetchVerificationStatus();
        
        // Desabilita o botão de reenvio por 60 segundos
        setResendDisabled(true);
        setCountdown(60);
        
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setResendDisabled(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast({
          title: "Falha no reenvio",
          description: data.message || "Não foi possível reenviar o código. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro no servidor",
        description: "Ocorreu um erro ao reenviar o código. Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim().length === 6) {
      verifyMutation.mutate(verificationCode);
    } else {
      toast({
        title: "Código inválido",
        description: "Por favor, digite um código de 6 dígitos válido.",
        variant: "destructive",
      });
    }
  };

  const handleResendCode = () => {
    if (!resendDisabled) {
      resendMutation.mutate();
    }
  };

  // Se não tiver usuário ou o email já estiver confirmado, não mostrar o modal
  if (!user || user.emailconfirmed === true) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogContent className="sm:max-w-md" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Verificação de E-mail</DialogTitle>
          <DialogDescription>
            Precisamos verificar seu endereço de e-mail para continuar
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-6">
          <div className="flex items-center justify-center mb-4">
            {verificationStatus?.sent ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <AlertCircle className="h-12 w-12 text-amber-500" />
            )}
          </div>
          <p className="text-center text-sm mb-4">
            {verificationStatus?.sent ? (
              <>
                Um código de verificação foi enviado para <strong>{user.email}</strong>. 
                Por favor, verifique sua caixa de entrada (e pasta de spam) e insira o código de 6 dígitos abaixo.
              </>
            ) : (
              <>
                Não encontramos registro de um código enviado para <strong>{user.email}</strong>. 
                Clique em "Enviar código" para receber um novo código de verificação.
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label htmlFor="verification-code" className="block text-sm font-medium mb-1">
              Código de verificação
            </label>
            <Input
              id="verification-code"
              type="text"
              placeholder="Digite o código de 6 dígitos"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              pattern="[0-9]{6}"
              maxLength={6}
              className="font-mono tracking-wider text-center text-lg"
              disabled={verifyMutation.isPending}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={verificationCode.length !== 6 || verifyMutation.isPending}
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar e-mail"
            )}
          </Button>
        </form>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-0">
          <div className="text-center text-sm mb-2">
            Não recebeu o código? 
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleResendCode}
            disabled={resendDisabled || resendMutation.isPending}
          >
            {resendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : resendDisabled ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Aguarde {countdown}s para reenviar
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Enviar código
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}