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
import { Loader2, CheckCircle, AlertCircle, RefreshCw, ShieldCheck, Mail } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

export function EmailVerificationModal() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Verificar se deve mostrar o modal (usuário logado com email não confirmado)
  // No novo sistema, todos os emails são automaticamente verificados
  // então este componente não precisa mais ser exibido
  useEffect(() => {
    // Forçar modal a permanecer fechado
    setOpen(false);
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
        // Mostrar animação de sucesso antes de fechar o modal
        setVerificationSuccess(true);
        
        toast({
          title: "Email verificado com sucesso!",
          description: "Agora você tem acesso completo à plataforma.",
          variant: "default",
        });
        
        // Recarregar a página para atualizar os dados do usuário
        // Usando um timeout menor para melhorar a experiência
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast({
          title: "Falha na verificação",
          description: data.message || "Opa! Código inválido ou expirado. Tente novamente 😊",
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
    // Limpar espaços e caracteres não numéricos
    const cleanedCode = verificationCode.replace(/\D/g, '').trim();
    
    if (cleanedCode.length === 6) {
      // Log para depuração
      console.log("[EmailVerification] Enviando código para verificação:", cleanedCode);
      verifyMutation.mutate(cleanedCode);
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

  // Com a nova implementação, sempre retornar null para desativar completamente o componente
  // independentemente do status de verificação do email
  return null;

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogContent className="sm:max-w-md" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        {verificationSuccess ? (
          // Tela de sucesso animada
          <motion.div 
            className="flex flex-col items-center justify-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="mb-6"
            >
              <div className="rounded-full bg-green-100 p-4 mb-4">
                <ShieldCheck className="h-16 w-16 text-green-500" />
              </div>
            </motion.div>
            
            <motion.h2 
              className="text-2xl font-bold text-center mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Verificação Concluída!
            </motion.h2>
            
            <motion.p 
              className="text-center text-muted-foreground mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Seu e-mail foi confirmado com sucesso. Você agora tem acesso completo à plataforma.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-sm text-muted-foreground flex items-center justify-center"
            >
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Acessando o painel...
            </motion.div>
          </motion.div>
        ) : (
          // Formulário de verificação normal
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">📩 Quase lá! Só falta confirmar seu e-mail</DialogTitle>
              <DialogDescription className="text-base">
                Para garantir sua segurança e liberar o acesso completo à plataforma
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-6">
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    repeat: Infinity,
                    repeatType: "mirror",
                    repeatDelay: 3,
                    duration: 0.5
                  }}
                >
                  <Mail className="h-12 w-12 text-green-500" />
                </motion.div>
              </div>
              <p className="text-center text-base mb-4">
                <>
                  <span className="block font-medium mb-2">Um código foi enviado para:</span>
                  <span className="block text-primary font-bold mb-2">{user.email}</span>
                  <span className="block">
                    Digite o código de 6 dígitos abaixo para confirmar sua conta e acessar a plataforma completa.
                  </span>
                </>
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="relative">
                <label htmlFor="verification-code" className="block text-sm font-medium mb-2 flex items-center">
                  <span className="bg-primary/10 text-primary p-1 rounded-md mr-2">
                    <span className="flex items-center justify-center h-4 w-4">
                      <ShieldCheck className="h-3 w-3" />
                    </span>
                  </span>
                  Código de verificação
                </label>
                
                <div className="relative">
                  <Input
                    id="verification-code"
                    type="tel" 
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Digite o código de 6 dígitos"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    pattern="[0-9]{6}"
                    maxLength={6}
                    className="font-mono tracking-wider text-center text-lg pr-10"
                    disabled={verifyMutation.isPending}
                  />
                  
                  {verificationCode.length > 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {verificationCode.length === 6 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {verificationCode.length}/6
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  Digite os 6 dígitos enviados para seu email
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 rounded-md relative overflow-hidden group"
                disabled={verificationCode.length !== 6 || verifyMutation.isPending}
              >
                <span className="relative z-10 flex items-center justify-center w-full">
                  {verifyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-5 w-5" />
                      <span>Verificar e-mail</span>
                    </>
                  )}
                </span>
                
                {!verifyMutation.isPending && verificationCode.length === 6 && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-full bg-primary/10"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </Button>
            </form>

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col items-center space-y-3">
                <div className="text-center text-sm text-muted-foreground flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  Não recebeu o código?
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full px-6 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  onClick={handleResendCode}
                  disabled={resendDisabled || resendMutation.isPending}
                >
                  {resendMutation.isPending ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Enviando...</span>
                    </div>
                  ) : resendDisabled ? (
                    <div className="flex items-center">
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ 
                          duration: 0.5,
                          repeat: 1,
                          repeatType: "loop",
                          ease: "easeInOut"
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                      </motion.div>
                      <span>Aguarde {countdown}s</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      <span>Reenviar código</span>
                    </div>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Verifique também sua pasta de spam. O código é válido por 10 minutos.
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}