import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Upload, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from '@/hooks/use-auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const reportFormSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(20, "A descrição deve ter pelo menos 20 caracteres"),
  reportTypeId: z.string().min(1, "Selecione um tipo de denúncia"),
  artId: z.string().optional(),
  evidence: z.any()
    .optional()
    .refine(
      (file) => !file || !file.length || (file[0]?.size ?? 0) <= MAX_FILE_SIZE,
      "O arquivo deve ter no máximo 5MB"
    )
    .refine(
      (file) => !file || !file.length || ACCEPTED_FILE_TYPES.includes(file[0]?.type ?? ''),
      "Formato de arquivo não suportado. Use JPG, PNG, WEBP ou PDF"
    ),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

type ReportType = {
  id: number;
  name: string;
  description: string | null;
};

const ReportForm = () => {
  const [open, setOpen] = useState(false);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: "",
      description: "",
      reportTypeId: "",
      artId: "",
      evidence: undefined
    },
  });

  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        const response = await fetch('/api/reports/types');
        if (!response.ok) {
          throw new Error('Erro ao carregar tipos de denúncia');
        }
        const data = await response.json();
        setReportTypes(data);
      } catch (error) {
        console.error('Erro ao carregar tipos de denúncia:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os tipos de denúncia",
          variant: "destructive",
        });
      }
    };

    fetchReportTypes();
  }, [toast]);

  const onSubmit = async (values: ReportFormValues) => {
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para enviar uma denúncia",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('reportTypeId', values.reportTypeId);
      
      if (values.artId) {
        formData.append('artId', values.artId);
      }
      
      if (values.evidence && values.evidence.length > 0) {
        formData.append('evidence', values.evidence[0]);
      }
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao enviar denúncia');
      }
      
      toast({
        title: "Denúncia enviada",
        description: "Sua denúncia foi enviada com sucesso e será analisada por nossa equipe",
      });
      
      // Resetar formulário e fechar modal
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar denúncia",
        description: error.message || "Ocorreu um erro ao enviar sua denúncia",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="text-neutral-500 text-xs">
          Reportar problema
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar problema</DialogTitle>
          <DialogDescription>
            Envie uma denúncia sobre conteúdo que viola nossos termos ou direitos autorais
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="reportTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de denúncia</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de denúncia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
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
                    <Input placeholder="Título da denúncia" {...field} />
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
                      placeholder="Descreva o problema com detalhes" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evidence"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Evidência (opcional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="dropzone-file"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-neutral-50 border-neutral-300 hover:bg-neutral-100"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-neutral-400" />
                          <p className="mb-2 text-sm text-neutral-500">
                            <span className="font-medium">Clique para enviar</span> ou arraste um arquivo
                          </p>
                          <p className="text-xs text-neutral-500">
                            JPG, PNG, WEBP ou PDF (max. 5MB)
                          </p>
                        </div>
                        <input
                          id="dropzone-file"
                          type="file"
                          className="hidden"
                          accept={ACCEPTED_FILE_TYPES.join(',')}
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                        />
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar denúncia"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportForm;