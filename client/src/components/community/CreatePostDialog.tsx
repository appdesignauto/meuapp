import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X, Upload, FileImage } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

// Esquema de validação para o formulário
const formSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").max(100),
  content: z.string().optional(),
  imageFile: z
    .instanceof(File)
    .refine((file) => file.size < 5 * 1024 * 1024, {
      message: "A imagem deve ter menos de 5MB",
    })
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      {
        message: "Formato de arquivo inválido. Use JPEG, PNG ou WEBP.",
      }
    ),
  editLink: z.string().url("Digite uma URL válida").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      editLink: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/community/posts", data, {
        isFormData: true,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidar consultas para recarregar a lista de posts
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      
      // Limpar o formulário
      form.reset();
      setPreviewUrl(null);
      
      // Fechar o diálogo
      onOpenChange(false);
      
      toast({
        title: "Post criado com sucesso!",
        description: "Seu post foi enviado para aprovação e será publicado em breve.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar post",
        description: error.message || "Ocorreu um erro ao criar o post. Tente novamente.",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar o arquivo
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "A imagem deve ter menos de 5MB",
      });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Use apenas imagens JPEG, PNG ou WEBP",
      });
      return;
    }

    // Criar URL para preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Definir o arquivo no formulário
    form.setValue("imageFile", file, { shouldValidate: true });
  };

  const clearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    form.setValue("imageFile", undefined as any, { shouldValidate: true });
    // Limpar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.imageFile) {
      toast({
        variant: "destructive",
        title: "Imagem obrigatória",
        description: "É necessário enviar uma imagem para criar um post",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    if (values.content) formData.append("content", values.content);
    if (values.editLink) formData.append("editLink", values.editLink);
    formData.append("image", values.imageFile);

    createPostMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Criar Postagem</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Upload de imagem */}
            <div className="space-y-2">
              <Label>
                Imagem do Post <span className="text-red-500">*</span>
              </Label>
              
              {previewUrl ? (
                <div className="relative mt-2 border rounded-md overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-[300px] object-contain bg-slate-50"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors duration-200"
                >
                  <FileImage className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">
                    Clique para fazer upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WEBP (Máx. 5MB)
                  </p>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              
              {form.formState.errors.imageFile && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.imageFile.message}
                </p>
              )}
            </div>
            
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Título <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título do post" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Descrição */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva uma descrição (opcional)"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Link de edição */}
            <FormField
              control={form.control}
              name="editLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link de Edição</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Link para edição (Canva, Google Slides, etc.)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex justify-between pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending}
                className="gap-2"
              >
                {createPostMutation.isPending && (
                  <LoadingScreen size="xs" label="" />
                )}
                Publicar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}