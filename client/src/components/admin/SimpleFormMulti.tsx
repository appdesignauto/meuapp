import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Loader2, Upload, X, Check, AlertCircle, 
  Settings2, FileImage, FolderOpen, FileType, LayoutGrid,
  BadgePlus, Link2, PenLine, UploadCloud
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// Esquema de formulário com validação
const formSchema = z.object({
  categoryId: z.string().min(1, "Por favor selecione uma categoria"),
  globalFileType: z.string().min(1, "Por favor selecione um tipo de arquivo"),
  isPremium: z.boolean().default(false),
  selectedFormats: z.array(z.string()).min(1, "Selecione pelo menos um formato")
});

type FormValues = z.infer<typeof formSchema>;

export default function SimpleFormMulti() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  // Consultas para obter dados
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: formats = [], isLoading: isLoadingFormats } = useQuery({
    queryKey: ['/api/formats'],
  });

  const { data: fileTypes = [], isLoading: isLoadingFileTypes } = useQuery({
    queryKey: ['/api/fileTypes'],
  });

  // Configuração do formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      globalFileType: 'canva', // "canva" como tipo de arquivo padrão
      isPremium: true, // Arte premium sempre selecionada por padrão
      selectedFormats: []
    },
  });

  // Estado de carregamento
  const isLoading = isLoadingCategories || isLoadingFormats || isLoadingFileTypes;

  // Manipulador de envio do formulário
  const onSubmit = (data: FormValues) => {
    toast({
      title: "Formulário em desenvolvimento",
      description: `Formatos selecionados: ${data.selectedFormats.join(", ")}`,
    });
  };

  // Manipulador para seleção de formatos
  const toggleFormat = (formatSlug: string) => {
    const currentFormats = form.getValues().selectedFormats || [];
    let newFormats;
    
    if (currentFormats.includes(formatSlug)) {
      newFormats = currentFormats.filter(slug => slug !== formatSlug);
    } else {
      newFormats = [...currentFormats, formatSlug];
    }
    
    form.setValue('selectedFormats', newFormats, { shouldValidate: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white pb-8">
          <div className="flex items-center mb-2">
            <FileImage className="h-6 w-6 mr-2" />
            <CardTitle>Adicionar Arte Multi-Formato</CardTitle>
          </div>
          <CardDescription className="text-blue-100">
            Crie uma arte com variações para diferentes formatos (feed, stories, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 px-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Seção de configuração global */}
            <div className="bg-blue-50/60 p-6 rounded-xl border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <Settings2 className="h-5 w-5 mr-2 text-blue-600" />
                Configuração Global
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-medium flex items-center">
                      <FolderOpen className="h-4 w-4 mr-1.5 text-blue-600" />
                      Categoria <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Controller
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.categoryId && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.categoryId.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="globalFileType" className="text-sm font-medium flex items-center">
                      <FileType className="h-4 w-4 mr-1.5 text-blue-600" />
                      Tipo de Arquivo <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Controller
                      control={form.control}
                      name="globalFileType"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {fileTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.slug}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col justify-center">
                  <div className="bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                      <BadgePlus className="h-4 w-4 mr-1.5 text-blue-600" />
                      Visibilidade da Arte
                    </h4>
                    <div className="flex items-center space-x-3">
                      <Controller
                        control={form.control}
                        name="isPremium"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="isPremium"
                            className="data-[state=checked]:bg-blue-600"
                          />
                        )}
                      />
                      <Label htmlFor="isPremium" className="font-medium text-gray-700">Arte Premium</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Seleção de formatos */}
            <div className="pt-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <LayoutGrid className="h-5 w-5 mr-2 text-blue-600" />
                Formatos<span className="text-red-500 ml-1">*</span>
              </h3>
              <p className="text-sm text-gray-500 mb-5">Selecione um ou mais formatos para sua arte</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formats.map((format: any) => {
                  const isSelected = form.getValues().selectedFormats.includes(format.slug);
                  return (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => toggleFormat(format.slug)}
                      className={`
                        py-3 px-4 rounded-lg font-medium text-center
                        transition-all duration-200 shadow-sm
                        ${isSelected 
                          ? 'bg-blue-600 text-white transform scale-105 ring-2 ring-blue-300'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                        }
                      `}
                    >
                      {format.name}
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.selectedFormats && (
                <p className="text-sm text-red-500 mt-2">
                  {form.formState.errors.selectedFormats.message}
                </p>
              )}
            </div>

            {/* Resumo dos formatos selecionados */}
            {form.getValues().selectedFormats.length > 0 && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-2">Formatos selecionados:</h3>
                <div className="flex flex-wrap gap-2">
                  {form.getValues().selectedFormats.map(formatSlug => {
                    const formatInfo = formats.find((f: any) => f.slug === formatSlug);
                    const formatName = formatInfo ? formatInfo.name : formatSlug;
                    
                    return (
                      <div key={formatSlug} className="px-3 py-1 rounded-full text-sm flex items-center gap-1 bg-green-100 text-green-800">
                        {formatName}
                        <Check className="h-3 w-3" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botão de enviar */}
            <div className="flex justify-end mt-8">
              <Button 
                type="submit"
                disabled={form.getValues().selectedFormats.length === 0}
                className="px-8"
              >
                Próximo Passo
              </Button>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800 mt-8">
              <h3 className="text-md font-medium flex items-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2" />
                Funcionalidade em Desenvolvimento
              </h3>
              <p className="text-sm">
                Esta versão do formulário está em construção. A funcionalidade completa estará disponível em breve.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}