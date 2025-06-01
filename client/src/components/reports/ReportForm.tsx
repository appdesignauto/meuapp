import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Bug, BookCopy, AlertTriangle, HelpCircle, PanelRight, User } from 'lucide-react';

// Definir os tipos de problema pré-definidos
const problemTypes = [
  { id: 1, name: 'Plágio', description: 'Arte copiada sem autorização ou crédito', icon: <BookCopy className="h-4 w-4" /> },
  { id: 2, name: 'Arte com erro', description: 'Problemas técnicos com arte (links quebrados, imagem corrompida)', icon: <Bug className="h-4 w-4" /> },
  { id: 3, name: 'Conteúdo inadequado', description: 'Material ofensivo, inapropriado ou que viola diretrizes', icon: <AlertTriangle className="h-4 w-4" /> },
  { id: 4, name: 'Outro', description: 'Qualquer outro problema não listado acima', icon: <HelpCircle className="h-4 w-4" /> },
];

// Schema do formulário para reportar problemas
const problemReportSchema = z.object({
  reportTypeId: z.number({
    required_error: 'Selecione um tipo de problema',
  }),
  title: z.string()
    .min(5, { message: 'O título deve ter no mínimo 5 caracteres' })
    .max(100, { message: 'O título deve ter no máximo 100 caracteres' }),
  description: z.string()
    .min(10, { message: 'A descrição deve ter no mínimo 10 caracteres' })
    .max(1000, { message: 'A descrição deve ter no máximo 1000 caracteres' }),
  email: z.string()
    .email({ message: 'Insira um e-mail válido' })
    .optional()
    .or(z.literal('')),
  whatsapp: z.string()
    .min(10, { message: 'Número de WhatsApp inválido' })
    .max(15, { message: 'Número de WhatsApp muito longo' })
    .optional()
    .or(z.literal('')),
});

type ProblemReportValues = z.infer<typeof problemReportSchema>;

const ReportForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Inicializa o formulário
  const form = useForm<ProblemReportValues>({
    resolver: zodResolver(problemReportSchema),
    defaultValues: {
      reportTypeId: undefined,
      title: '',
      description: '',
      email: user?.email || '',
      whatsapp: '',
    },
  });
  
  // Atualiza o campo de e-mail quando o usuário estiver logado
  useEffect(() => {
    setIsLoggedIn(!!user);
    if (user?.email) {
      form.setValue('email', user.email);
    }
  }, [user, form]);

  // Limpa o formulário quando o diálogo é fechado
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(false);
      form.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, form]);

  const onSubmit = async (data: ProblemReportValues) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se há um arquivo selecionado
      let evidenceFile = null;
      if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
        evidenceFile = fileInputRef.current.files[0];
      }

      // Se há um arquivo, precisamos usar FormData
      if (evidenceFile) {
        const formData = new FormData();
        formData.append('reportTypeId', data.reportTypeId.toString());
        formData.append('title', data.title);
        formData.append('description', data.description);
        
        // Adiciona o ID do usuário quando logado
        if (isLoggedIn && user?.id) {
          formData.append('userId', user.id.toString());
        }
        
        // Adiciona campos de contato quando usuário não está logado
        if (!isLoggedIn && data.email) {
          formData.append('email', data.email);
        }
        
        if (!isLoggedIn && data.whatsapp) {
          formData.append('whatsapp', data.whatsapp);
        }

        formData.append('evidence', evidenceFile);

        const response = await fetch('/api/reports-v2/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao enviar relatório de problema');
        }

        // Sucesso
        setSuccess(true);
        
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);

        return;
      }

      // Se não há arquivo, podemos usar JSON (mais simples e direto)
      const jsonData: Record<string, any> = {
        reportTypeId: data.reportTypeId,
        title: data.title,
        description: data.description
      };
      
      // Adiciona o ID do usuário quando logado
      if (isLoggedIn && user?.id) {
        jsonData.userId = user.id;
      }
      
      // Adiciona campos de contato quando usuário não está logado
      if (!isLoggedIn && data.email) {
        jsonData.email = data.email;
      }
      
      if (!isLoggedIn && data.whatsapp) {
        jsonData.whatsapp = data.whatsapp;
      }
      
      const jsonResponse = await fetch('/api/reports-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      });

      if (!jsonResponse.ok) {
        const errorData = await jsonResponse.json();
        console.error('Erro detalhado:', errorData);
        throw new Error(errorData.message || 'Erro ao enviar relatório de problema');
      }

      setSuccess(true);
        
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('Erro ao enviar relatório:', err);
      setError(err.message || 'Erro ao enviar relatório. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="text-gray-600 hover:text-blue-600 text-xs sm:text-sm transition-colors text-left">
          Denunciar arquivo
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PanelRight className="h-5 w-5" />
            Reportar problema
          </DialogTitle>
          <DialogDescription>
            Ajude-nos a melhorar a plataforma relatando qualquer problema que encontrar.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Alert variant="success" className="mb-4 bg-green-50 border-green-700 text-green-800">
            <AlertCircle className="h-4 w-4 text-green-700" />
            <AlertTitle className="text-green-800">Enviado com sucesso!</AlertTitle>
            <AlertDescription className="text-green-700">
              Seu relatório foi recebido e será analisado pela nossa equipe. Agradecemos sua contribuição.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="reportTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de problema</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {problemTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()} className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              {type.icon}
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {form.watch('reportTypeId') && 
                        problemTypes.find(t => t.id === form.watch('reportTypeId'))?.description
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do problema</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Resumo breve do problema encontrado" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição detalhada</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva detalhadamente o problema, quando ocorre e como reproduzi-lo" 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isLoggedIn && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail para contato</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="seu@email.com" 
                            type="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          E-mail para que possamos entrar em contato sobre o problema
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          WhatsApp para facilitar o contato
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {isLoggedIn && (
                <Alert className="bg-blue-50 border-blue-200">
                  <User className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-700">Usuário identificado</AlertTitle>
                  <AlertDescription className="text-blue-600">
                    Você está logado como <strong>{user?.username}</strong>. Seu problema será associado à sua conta.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <FormLabel htmlFor="evidence">Evidência (opcional)</FormLabel>
                <Input
                  id="evidence"
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Aceita PNG, JPEG, WEBP ou PDF (máx. 5MB)
                </p>
              </div>

              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar relatório'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportForm;