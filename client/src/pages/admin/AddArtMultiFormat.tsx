import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, PlusCircle, Save, Pencil } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AddArtFormMulti from '@/components/admin/AddArtFormMulti';

const AddArtMultiFormat = () => {
  const { toast } = useToast();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('multiformat');

  // Verificar acesso do usuário
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'designer')) {
    return (
      <div className="container max-w-7xl py-10">
        <Alert variant="destructive">
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página. Esta área é restrita a administradores e designers.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="secondary" asChild>
            <Link href="/">Voltar para o início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Painel</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/arts">Gerenciar Artes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Adicionar Arte</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Adicionar Arte</h1>
          <p className="text-muted-foreground">
            Crie uma nova arte com múltiplos formatos para seus usuários.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/arts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="multiformat" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Múltiplos Formatos
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Formato Único (Legado)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="multiformat" className="mt-6">
          <AddArtFormMulti />
        </TabsContent>
        
        <TabsContent value="legacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Formulário Legado</CardTitle>
              <CardDescription>
                Este é o formulário antigo que permite adicionar apenas uma arte em um único formato.
                Recomendamos usar o novo formulário de múltiplos formatos para uma melhor experiência.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin/arts/add">Abrir Formulário Legado</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddArtMultiFormat;