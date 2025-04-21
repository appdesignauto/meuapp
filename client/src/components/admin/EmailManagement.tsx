import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Search, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from '@/lib/queryClient';

interface VerificationCode {
  id: number;
  userId: number;
  email: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt: string | null;
}

interface UserInfo {
  id: number;
  email: string;
  username: string;
  name: string | null;
  emailconfirmed: boolean;
}

interface VerificationResult {
  success: boolean;
  user?: UserInfo;
  verificationCodes?: VerificationCode[];
  emailLogs?: string[];
  message?: string;
}

/**
 * Componente para gerenciamento e diagnóstico de emails
 */
export default function EmailManagement() {
  const { toast } = useToast();
  const [emailInput, setEmailInput] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [emailLogs, setEmailLogs] = useState<string[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  /**
   * Formatar data e hora
   */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  /**
   * Verifica se um código está expirado
   */
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  /**
   * Busca logs gerais do serviço de email
   */
  const fetchEmailLogs = async () => {
    setIsLogsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/admin/email/logs');
      if (!response.ok) {
        throw new Error(`Erro ao buscar logs: ${response.status}`);
      }
      const data = await response.json();
      setEmailLogs(data.logs || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Falha ao carregar logs: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
    } finally {
      setIsLogsLoading(false);
    }
  };

  /**
   * Limpa logs do serviço de email
   */
  const clearEmailLogs = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os logs de email?')) {
      return;
    }
    setIsLogsLoading(true);
    try {
      const response = await apiRequest('DELETE', '/api/admin/email/logs');
      if (!response.ok) {
        throw new Error(`Erro ao limpar logs: ${response.status}`);
      }
      setEmailLogs([]);
      toast({
        title: 'Sucesso',
        description: 'Logs de email limpos com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Falha ao limpar logs: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
    } finally {
      setIsLogsLoading(false);
    }
  };

  /**
   * Busca status de verificação por email
   */
  const fetchVerificationByEmail = async () => {
    if (!emailInput) {
      toast({
        title: 'Aviso',
        description: 'Digite um email para consultar',
        variant: 'default'
      });
      return;
    }

    setIsLoading(true);
    setVerificationResult(null);
    
    try {
      const response = await apiRequest('GET', `/api/admin/email/verification/email/${encodeURIComponent(emailInput)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }
      
      const data = await response.json();
      setVerificationResult(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Falha ao buscar informações: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Busca status de verificação por ID de usuário
   */
  const fetchVerificationById = async () => {
    if (!userId || isNaN(Number(userId))) {
      toast({
        title: 'Aviso',
        description: 'Digite um ID de usuário válido',
        variant: 'default'
      });
      return;
    }

    setIsVerificationLoading(true);
    setVerificationResult(null);
    
    try {
      const response = await apiRequest('GET', `/api/admin/email/verification/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }
      
      const data = await response.json();
      setVerificationResult(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Falha ao buscar informações: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
    } finally {
      setIsVerificationLoading(false);
    }
  };

  /**
   * Reenvia código de verificação
   */
  const resendVerificationCode = async () => {
    if (!verificationResult?.user) {
      toast({
        title: 'Aviso',
        description: 'Nenhum usuário selecionado',
        variant: 'default'
      });
      return;
    }

    setIsResendLoading(true);
    
    try {
      const response = await apiRequest('POST', `/api/admin/email/verification/${verificationResult.user.id}/resend`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }
      
      const data = await response.json();
      
      toast({
        title: 'Sucesso',
        description: data.message || 'Código de verificação reenviado com sucesso'
      });
      
      // Recarregar dados para mostrar o novo código
      if (verificationResult.user.id) {
        setTimeout(() => {
          fetchVerificationById();
        }, 1000);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Falha ao reenviar código: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
    } finally {
      setIsResendLoading(false);
    }
  };

  /**
   * Verificação manual de email
   */
  const verifyManually = async () => {
    if (!verificationResult?.user) {
      toast({
        title: 'Aviso',
        description: 'Nenhum usuário selecionado',
        variant: 'default'
      });
      return;
    }

    if (verificationResult.user.emailconfirmed) {
      toast({
        title: 'Aviso',
        description: 'Este email já está verificado',
        variant: 'default'
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja marcar o email ${verificationResult.user.email} como verificado manualmente?`)) {
      return;
    }

    setIsVerifyLoading(true);
    
    try {
      const response = await apiRequest('POST', `/api/admin/email/verification/${verificationResult.user.id}/verify`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }
      
      const data = await response.json();
      
      toast({
        title: 'Sucesso',
        description: data.message || 'Email verificado com sucesso'
      });
      
      // Recarregar dados
      if (verificationResult.user.id) {
        setTimeout(() => {
          fetchVerificationById();
        }, 1000);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Falha ao verificar email: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
    } finally {
      setIsVerifyLoading(false);
    }
  };

  /**
   * Teste de entregabilidade de email
   */
  const testEmailDelivery = async () => {
    if (!emailInput) {
      toast({
        title: 'Aviso',
        description: 'Digite um email para testar',
        variant: 'default'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/admin/email/test-delivery', { email: emailInput });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }
      
      const data = await response.json();
      
      toast({
        title: 'Sucesso',
        description: data.message || `Email de teste enviado para ${emailInput}`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Falha ao enviar email de teste: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciamento de Emails</CardTitle>
        <CardDescription>
          Diagnóstico e gerenciamento de verificação de emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">Logs de Email</TabsTrigger>
            <TabsTrigger value="verification">Verificação</TabsTrigger>
            <TabsTrigger value="test">Teste</TabsTrigger>
          </TabsList>
          
          {/* Aba de Logs */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between mb-4">
              <Button 
                onClick={fetchEmailLogs} 
                disabled={isLogsLoading}
                variant="outline"
              >
                {isLogsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Carregar Logs
              </Button>
              <Button 
                onClick={clearEmailLogs} 
                disabled={isLogsLoading} 
                variant="destructive"
              >
                Limpar Logs
              </Button>
            </div>
            
            <ScrollArea className="h-[500px] w-full rounded-md border">
              {emailLogs.length > 0 ? (
                <div className="p-4 font-mono text-sm whitespace-pre-wrap">
                  {emailLogs.map((log, index) => (
                    <div key={index} className="mb-1 pb-1 border-b border-gray-100">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-full p-4 text-gray-500">
                  {isLogsLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <p>Nenhum log disponível. Clique em "Carregar Logs" para buscar.</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          {/* Aba de Verificação */}
          <TabsContent value="verification" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Buscar por email</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <Button 
                      onClick={fetchVerificationByEmail} 
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Ou por ID do usuário</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="ID do usuário"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    />
                    <Button 
                      onClick={fetchVerificationById} 
                      disabled={isVerificationLoading}
                    >
                      {isVerificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              {verificationResult && verificationResult.user && (
                <div className="mt-4 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-2">Informações do Usuário</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>ID:</strong> {verificationResult.user.id}</p>
                        <p><strong>Nome:</strong> {verificationResult.user.name || verificationResult.user.username}</p>
                        <p><strong>Username:</strong> {verificationResult.user.username}</p>
                      </div>
                      <div>
                        <p><strong>Email:</strong> {verificationResult.user.email}</p>
                        <p>
                          <strong>Status de Verificação:</strong> {' '}
                          {verificationResult.user.emailconfirmed ? (
                            <Badge variant="success" className="bg-green-500">Verificado</Badge>
                          ) : (
                            <Badge variant="destructive">Não Verificado</Badge>
                          )}
                        </p>
                        {!verificationResult.user.emailconfirmed && (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              onClick={resendVerificationCode}
                              disabled={isResendLoading}
                            >
                              {isResendLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                              Reenviar Código
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={verifyManually}
                              disabled={isVerifyLoading}
                            >
                              {isVerifyLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                              Verificar Manualmente
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabela de códigos de verificação */}
                  {verificationResult.verificationCodes && verificationResult.verificationCodes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Códigos de Verificação</h3>
                      <Table>
                        <TableCaption>Histórico de códigos de verificação enviados</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead>Expira em</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Usado em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {verificationResult.verificationCodes.map((code) => (
                            <TableRow key={code.id}>
                              <TableCell className="font-mono">{code.code}</TableCell>
                              <TableCell>{formatDate(code.createdAt)}</TableCell>
                              <TableCell>
                                {formatDate(code.expiresAt)}{' '}
                                {isExpired(code.expiresAt) && !code.isUsed && (
                                  <Badge variant="outline" className="ml-2 bg-yellow-100">Expirado</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {code.isUsed ? (
                                  <Badge className="bg-green-500">Usado</Badge>
                                ) : (
                                  <Badge variant="outline">Não Usado</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {code.usedAt ? formatDate(code.usedAt) : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {/* Logs específicos do email */}
                  {verificationResult.emailLogs && verificationResult.emailLogs.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Logs deste Email</h3>
                      <ScrollArea className="h-[200px] w-full rounded-md border">
                        <div className="p-4 font-mono text-sm whitespace-pre-wrap">
                          {verificationResult.emailLogs.map((log, index) => (
                            <div key={index} className="mb-1 pb-1 border-b border-gray-100">
                              {log}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
              
              {verificationResult && verificationResult.message && !verificationResult.user && (
                <div className="flex items-center p-4 mt-4 bg-red-50 text-red-800 rounded-md">
                  <XCircle className="h-5 w-5 mr-2" />
                  {verificationResult.message}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Aba de Teste */}
          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Testar Entregabilidade de Email</CardTitle>
                <CardDescription>
                  Envie um email de teste para verificar se o sistema consegue entregar emails para um determinado endereço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email para Teste</label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">
                      Esta operação enviará um email de teste contendo um código de verificação para o endereço informado.
                      Use isso para verificar se há problemas de entregabilidade com este email.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={testEmailDelivery} 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Enviar Email de Teste
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}