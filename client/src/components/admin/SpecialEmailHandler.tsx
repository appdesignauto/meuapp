import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Copy,
  Mail,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface SpecialEmailHandlerProps {
  onVerificationComplete?: () => void;
}

export default function SpecialEmailHandler({ onVerificationComplete }: SpecialEmailHandlerProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("fernando.sim2018@gmail.com");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState<string | null>(null);

  // Mutation para enviar código especial
  const sendSpecialCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest(
        "POST",
        `/api/email-verification/special-case/${email}`
      );
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Código enviado com sucesso",
          description: `Um código especial foi enviado para ${email}`,
          variant: "default",
        });
        
        // Se o código estiver disponível na resposta (apenas em ambiente de teste/desenvolvimento)
        if (data.code) {
          setSentCode(data.code);
        }
      } else {
        toast({
          title: "Falha ao enviar código",
          description: data.message || "Ocorreu um erro ao enviar o código especial",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro de servidor",
        description: "Não foi possível processar a solicitação no momento",
        variant: "destructive",
      });
    },
  });

  // Mutation para verificar código especial
  const verifySpecialCodeMutation = useMutation({
    mutationFn: async (params: { email: string; code: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/email-verification/special-verify/${params.email}`,
        { code: params.code }
      );
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Verificação bem-sucedida",
          description: `O email ${email} foi verificado com sucesso`,
          variant: "default",
        });
        
        // Limpar o formulário
        setVerificationCode("");
        setSentCode(null);
        
        // Notificar componente pai se necessário
        if (onVerificationComplete) {
          onVerificationComplete();
        }
      } else {
        toast({
          title: "Falha na verificação",
          description: data.message || "O código fornecido é inválido ou expirou",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro de servidor",
        description: "Não foi possível processar a verificação no momento",
        variant: "destructive",
      });
    },
  });

  // Mutation para forçar verificação direta
  const forceVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest(
        "POST",
        `/api/email-verification/force-verification/${email}`
      );
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Verificação forçada concluída",
          description: `O email ${email} foi verificado diretamente com sucesso`,
          variant: "default",
        });
        
        // Notificar componente pai se necessário
        if (onVerificationComplete) {
          onVerificationComplete();
        }
      } else {
        toast({
          title: "Falha na verificação forçada",
          description: data.message || "Não foi possível forçar a verificação",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro de servidor",
        description: "Não foi possível processar a verificação forçada no momento",
        variant: "destructive",
      });
    },
  });

  // Função para copiar o código para a área de transferência
  const copyCodeToClipboard = () => {
    if (sentCode) {
      navigator.clipboard.writeText(sentCode);
      toast({
        title: "Código copiado",
        description: "O código foi copiado para a área de transferência",
        variant: "default",
      });
    }
  };

  const handleSendSpecialCode = () => {
    if (email) {
      sendSpecialCodeMutation.mutate(email);
    } else {
      toast({
        title: "Email necessário",
        description: "Por favor, forneça um endereço de email",
        variant: "destructive",
      });
    }
  };

  const handleVerifySpecialCode = () => {
    if (email && verificationCode) {
      verifySpecialCodeMutation.mutate({ email, code: verificationCode });
    } else {
      toast({
        title: "Informações incompletas",
        description: "Email e código de verificação são necessários",
        variant: "destructive",
      });
    }
  };

  const handleForceVerification = () => {
    if (email) {
      // Confirmar a ação do usuário
      if (window.confirm(`Tem certeza que deseja forçar a verificação para ${email}? Esta ação não pode ser desfeita.`)) {
        forceVerificationMutation.mutate(email);
      }
    } else {
      toast({
        title: "Email necessário",
        description: "Por favor, forneça um endereço de email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
            Manipulador de Emails Especiais
          </CardTitle>
          <CardDescription>
            Tratamento de casos conhecidos com problemas de entrega de email
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertTitle>Aviso Importante</AlertTitle>
            <AlertDescription>
              Este módulo é destinado apenas para endereços de email com problemas conhecidos de recebimento. 
              Atualmente configurado para: <strong>fernando.sim2018@gmail.com</strong>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Endereço de Email Problemático
            </label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              disabled
              className="bg-slate-50 dark:bg-slate-800/50"
            />
          </div>

          <div className="mt-4 space-y-4">
            <Button
              type="button"
              onClick={handleSendSpecialCode}
              className="w-full"
              disabled={sendSpecialCodeMutation.isPending}
            >
              {sendSpecialCodeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando código especial...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Código Especial
                </>
              )}
            </Button>

            {sentCode && (
              <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="flex w-full justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-500 mr-2" />
                    <span className="font-mono text-sm">Código: {sentCode}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCodeToClipboard}
                    className="h-7 px-2"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Código de Verificação
              </label>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Digite o código de 6 dígitos"
                maxLength={6}
              />
            </div>

            <Button
              type="button"
              onClick={handleVerifySpecialCode}
              className="w-full"
              variant="outline"
              disabled={
                verifySpecialCodeMutation.isPending || !verificationCode
              }
            >
              {verifySpecialCodeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verificar Código
                </>
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="w-full border-t pt-4">
            <h4 className="text-sm font-medium flex items-center mb-2">
              <Shield className="mr-2 h-4 w-4 text-red-500" />
              Ações Administrativas
            </h4>
            <Button
              type="button"
              onClick={handleForceVerification}
              className="w-full"
              variant="destructive"
              disabled={forceVerificationMutation.isPending}
            >
              {forceVerificationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Forçar Verificação Direta
                </>
              )}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>
              Use esta opção apenas em último caso. A verificação forçada marcará o email como 
              verificado no banco de dados sem enviar ou verificar códigos.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}