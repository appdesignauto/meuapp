import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import AvatarUploader from '@/components/profile/AvatarUploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, User, Clock, Star, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    console.log('Avatar atualizado:', newAvatarUrl);
    // O banco de dados já será atualizado pelo servidor, então não precisamos fazer nada aqui
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          bio,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil');
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar perfil',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const getSubscriptionBadge = () => {
    if (!user) return null;

    if (user.tipoplano === 'vitalicio') {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-gradient-to-r from-violet-500 to-purple-600 text-white">
          Vitalício
        </span>
      );
    } else if (user.tipoplano === 'anual') {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
          Anual
        </span>
      );
    } else if (user.tipoplano === 'mensal') {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          Mensal
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">
        Gratuito
      </span>
    );
  };

  return (
    <div className="container mx-auto p-4 pt-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <AvatarUploader 
            currentAvatarUrl={user?.profileimageurl || undefined}
            onSuccess={handleAvatarUpdate}
          />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informações</span>
                {getSubscriptionBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Membro desde</p>
                  <p className="font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    {formatDate(user.criadoem)}
                  </p>
                </div>
                {user.dataassinatura && (
                  <div>
                    <p className="text-sm text-muted-foreground">Assinatura iniciada em</p>
                    <p className="font-medium">{formatDate(user.dataassinatura)}</p>
                  </div>
                )}
                {user.dataexpiracao && !user.acessovitalicio && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expira em</p>
                    <p className="font-medium">{formatDate(user.dataexpiracao)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="info">
                <User className="h-4 w-4 mr-1" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="favorites">
                <Heart className="h-4 w-4 mr-1" />
                Favoritos
              </TabsTrigger>
              <TabsTrigger value="stats">
                <Star className="h-4 w-4 mr-1" />
                Estatísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Editar Perfil</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form 
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProfileUpdate();
                    }}
                  >
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-medium">
                        Nome
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="bio" className="block text-sm font-medium">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        value={bio || ''}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Uma breve descrição sobre você"
                        className="w-full min-h-[100px] p-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar alterações
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle>Favoritos</CardTitle>
                  <CardDescription>
                    Artes que você marcou como favoritas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Funcionalidade em desenvolvimento
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                  <CardDescription>
                    Sua atividade na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-card text-center">
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Downloads</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card text-center">
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Favoritos</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card text-center">
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Visualizações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}