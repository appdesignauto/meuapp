import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Definir o schema para o formulário
const reportFormSchema = z.object({
  typeId: z.string({
    required_error: 'Selecione um tipo de denúncia',
  }),
  title: z.string()
    .min(5, { message: 'O título deve ter no mínimo 5 caracteres' })
    .max(100, { message: 'O título deve ter no máximo 100 caracteres' }),
  description: z.string()
    .min(20, { message: 'A descrição deve ter no mínimo 20 caracteres' })
    .max(1000, { message: 'A descrição deve ter no máximo 1000 caracteres' }),
  url: z.string()
    .url({ message: 'Por favor, insira um URL válido' })
    .optional()
    .or(z.literal('')),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

type ReportType = {
  id: number;
  name: string;
  description: string;
};

const ReportForm = () => {
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      typeId: '',
      title: '',
      description: '',
      url: '',
    },
  });

  useEffect(() => {
    // Carregar os tipos de denúncia a partir do arquivo estático
    const loadReportTypes = async () => {
      try {
        setLoadingTypes(true);
        setError(null);
        
        // Primeiro tentamos carregar do endpoint da API
        try {
          const response = await fetch('/api/reports/types');
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              setReportTypes(data);
              setLoadingTypes(false);
              return;
            }
          }
        } catch (apiError) {
          console.error('Erro ao carregar tipos de denúncia da API:', apiError);
        }
        
        // Se a API falhar, carregamos do arquivo estático
        const staticResponse = await fetch('/data/report-types.json');
        if (staticResponse.ok) {
          const staticData = await staticResponse.json();
          setReportTypes(staticData);
        } else {
          throw new Error('Não foi possível carregar os tipos de denúncia');
        }
      } catch (err) {
        console.error('Erro ao carregar tipos de denúncia:', err);
        setError('Não foi possível carregar os tipos de denúncia');
      } finally {
        setLoadingTypes(false);
      }
    };

    if (isOpen) {
      loadReportTypes();
    }
  }, [isOpen]);

  const onSubmit = async (data: ReportFormValues) => {
    try {
      setLoading(true);
      setError(null);

      // Criar um objeto FormData para enviar arquivos
      const formData = new FormData();
      formData.append('typeId', data.typeId);
      formData.append('title', data.title);
      formData.append('description', data.description);
      
      if (data.url) {
        formData.append('url', data.url);
      }

      // Adicionar o arquivo se selecionado
      if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
        formData.append('evidence', fileInputRef.current.files[0]);
      }

      // Enviar a denúncia
      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
        // Não definir o cabeçalho Content-Type para que o navegador defina corretamente com boundary para FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar denúncia');
      }

      // Sucesso
      toast({
        title: 'Denúncia enviada',
        description: 'Sua denúncia foi enviada com sucesso. Agradecemos sua contribuição.',
      });

      // Limpar formulário e fechar modal
      form.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsOpen(false);
    } catch (err: any) {
      console.error('Erro ao enviar denúncia:', err);
      setError(err.message || 'Erro ao enviar denúncia. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="link" 
          className="text-neutral-500 hover:text-primary text-sm font-normal"
        >
          Denunciar conteúdo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Denunciar conteúdo</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="typeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de denúncia</FormLabel>
                  <Select
                    disabled={loadingTypes}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingTypes ? "Carregando..." : "Selecione um tipo"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Título resumido da denúncia" 
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhadamente o problema" 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exemplo.com/pagina-com-problema" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {loading ? 'Enviando...' : 'Enviar denúncia'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportForm;