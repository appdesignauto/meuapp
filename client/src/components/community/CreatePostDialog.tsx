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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload, FileImage, CloudUpload } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

// Esquema de validação para o formulário
const formSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").max(100).optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  postFormat: z.string().optional(),
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
      category: "",
      postFormat: "",
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

    if (!values.editLink) {
      toast({
        variant: "destructive",
        title: "URL obrigatória",
        description: "É necessário fornecer um link para edição",
      });
      return;
    }

    const formData = new FormData();
    if (values.title) formData.append("title", values.title);
    if (values.content) formData.append("content", values.content);
    formData.append("editLink", values.editLink);
    // Anexa campos adicionais do formulário se necessário
    if (values.category) formData.append("category", values.category);
    if (values.postFormat) formData.append("postFormat", values.postFormat);
    formData.append("image", values.imageFile);

    createPostMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium mb-4">Postagem</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Título da Postagem */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Título da Postagem
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título da postagem" className="rounded-md" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Categoria */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Categoria
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="vendas">Vendas</SelectItem>
                      <SelectItem value="mecanica">Mecânica</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                      <SelectItem value="lavagem">Lavagem</SelectItem>
                      <SelectItem value="seminovos">Seminovos</SelectItem>
                      <SelectItem value="promocoes">Promoções</SelectItem>
                      <SelectItem value="lancamentos">Lançamentos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Formato do post */}
            <FormField
              control={form.control}
              name="postFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Formato do post
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="feed">Feed</SelectItem>
                      <SelectItem value="stories">Stories</SelectItem>
                      <SelectItem value="cartaz">Cartaz</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="web banner">Web Banner</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <FormLabel className="text-sm font-medium">Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva uma descrição (opcional)"
                      className="resize-none rounded-md"
                      rows={3}
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
                  <FormLabel className="text-sm font-medium">
                    URL <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Cole aqui o link do Canva ou Google Drive"
                      className="rounded-md"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Upload de imagem */}
            <div>
              <FormLabel className="text-sm font-medium block mb-1">
                Envio de imagem PNG/JPG <span className="text-red-500">*</span> 
                <span className="text-xs text-gray-500 font-normal ml-1">(Tamanho máximo: 5MB)</span>
              </FormLabel>
              
              {previewUrl ? (
                <div className="relative mt-2 border rounded-md overflow-hidden bg-gray-50">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-[300px] object-contain"
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
                  className="border-2 border-dashed border-gray-300 rounded-md p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors duration-200 bg-[#f8f9fa]"
                >
                  <CloudUpload className="mx-auto h-10 w-10 text-blue-500 mb-2" />
                  <p className="text-base font-medium mb-1 text-gray-700">
                    Clique aqui para upload
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
            
            <DialogFooter className="flex justify-between pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-md">
                  Cancelar
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending}
                className="gap-2 rounded-md"
              >
                {createPostMutation.isPending && (
                  <LoadingScreen size="sm" label="" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}