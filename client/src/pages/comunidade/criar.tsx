import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, Upload, Loader2 } from 'lucide-react';

import TopBar from '@/components/TopBar';
import FooterMenu from '@/components/FooterMenu';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

// Esquema de validação do formulário
const formSchema = z.object({
  title: z.string()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(100, 'O título não pode ter mais de 100 caracteres'),
  content: z.string()
    .min(10, 'A descrição deve ter pelo menos 10 caracteres')
    .max(2000, 'A descrição não pode ter mais de 2000 caracteres'),
  image: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'O arquivo deve ter no máximo 5MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Apenas imagens JPG, PNG ou WebP são permitidas'
    ),
});

type FormValues = z.infer<typeof formSchema>;

const CreatePostPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Se não estiver logado, redirecionar para a página de login
  if (!user) {
    navigate('/login');
    return null;
  }
  
  // Inicialização do formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });
  
  // Mutação para criar um novo post
  const createPostMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('image', data.image);
      
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar post');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        description: 'Post criado com sucesso! Ele será revisado pelos administradores antes de ser publicado.',
      });
      navigate('/comunidade');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar post',
        description: error.message,
      });
    },
  });
  
  // Manipular o envio do formulário
  const onSubmit = (data: FormValues) => {
    createPostMutation.mutate(data);
  };
  
  // Manipular o upload da imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue('image', file, { shouldValidate: true });
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pb-16 md:pb-0">
      <TopBar showBack={true} backPath="/comunidade" title="Criar Post" />
      
      <div className="container max-w-2xl px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Upload de imagem */}
                <div className="space-y-2">
                  <FormLabel>Imagem</FormLabel>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center ${
                      form.formState.errors.image ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="mx-auto max-h-60 object-contain"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setImagePreview(null);
                            form.resetField('image');
                          }}
                        >
                          Alterar imagem
                        </Button>
                      </div>
                    ) : (
                      <div className="py-8">
                        <ImagePlus className="mx-auto h-12 w-12 text-zinc-400 mb-2" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                          Clique para fazer upload de uma imagem
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          JPG, PNG ou WebP • Máximo 5MB
                        </p>
                        <Input
                          type="file"
                          id="image-upload"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar imagem
                        </Button>
                      </div>
                    )}
                  </div>
                  {form.formState.errors.image && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.image.message as string}
                    </p>
                  )}
                </div>
                
                {/* Campo de título */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título do seu post" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Campo de conteúdo */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva seu trabalho, conte como foi feito e dicas que você tenha para outros designers..." 
                          rows={5}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Aviso sobre moderação */}
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-100 dark:border-blue-900/50">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    <strong>Nota:</strong> Todos os posts passam por moderação antes de serem publicados na comunidade.
                  </p>
                </div>
                
                {/* Botão de envio */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Publicar'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      <FooterMenu />
    </div>
  );
};

export default CreatePostPage;