import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LifeBuoy, Mail, MessageCircle, HeartHandshake, Users, CheckCircle2, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const SuportePage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envio de formulário (aqui seria integrado com o backend real)
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Mensagem enviada",
        description: "Recebemos sua mensagem e responderemos em breve.",
        variant: "default",
      });
      setFormData({
        nome: '',
        email: '',
        assunto: '',
        mensagem: ''
      });
    }, 1500);
  };

  return (
    <>
      <Helmet>
        <title>Suporte | Design Auto</title>
      </Helmet>
      
      <div className="container mx-auto py-6 sm:py-10 px-3 md:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Hero section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-3 sm:mb-4">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              Estamos aqui para ajudar você a aproveitar ao máximo o Design Auto. Escolha a opção que melhor atende às suas necessidades.
            </p>
          </div>
          
          <Tabs defaultValue="canais" className="mb-12">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-8 gap-1 relative z-20">
              <TabsTrigger value="canais">Canais de Atendimento</TabsTrigger>
              <TabsTrigger value="faq">Perguntas Frequentes</TabsTrigger>
              <TabsTrigger value="contato">Formulário de Contato</TabsTrigger>
            </TabsList>
            
            <TabsContent value="canais" className="mt-10 pt-2">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 sm:pb-3 space-y-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.6 6.32c-1.44-1.52-3.4-2.32-5.55-2.32-4.48 0-8.13 3.75-8.13 8.35 0 1.62.46 3.2 1.33 4.55L4.17 20.8l4.05-1.06c1.28.7 2.7 1.07 4.06 1.07 4.48 0 8.12-3.76 8.12-8.35s-2.14-6.14-2.8-6.14z" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg sm:text-xl">WhatsApp</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Atendimento rápido via WhatsApp</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 sm:pb-4">
                    <p className="text-xs sm:text-sm">
                      Horário de atendimento: Segunda à Sexta, das 9h às 18h
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">Tempo de resposta: 1-2h</Badge>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button 
                      className="w-full bg-green-500 hover:bg-green-600 text-xs sm:text-sm py-1 sm:py-2" 
                      onClick={() => window.open('https://wa.me/5527999999999', '_blank')}
                    >
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Conversar agora
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 sm:pb-3 space-y-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                      <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">E-mail</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Suporte por e-mail para dúvidas detalhadas</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 sm:pb-4">
                    <p className="text-xs sm:text-sm">
                      Envie suas dúvidas para nosso e-mail e nossa equipe responderá em breve.
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">Tempo de resposta: 24-48h</Badge>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs sm:text-sm py-1 sm:py-2"
                      onClick={() => window.location.href = 'mailto:suporte@designauto.com.br'}
                    >
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      suporte@designauto.com.br
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 sm:pb-3 space-y-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-50 rounded-full flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-violet-500" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">Comunidade</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Grupo de usuários no WhatsApp</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 sm:pb-4">
                    <p className="text-xs sm:text-sm">
                      Participe do nosso grupo e conecte-se com outros usuários do Design Auto.
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">+500 participantes</Badge>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button 
                      variant="secondary" 
                      className="w-full text-xs sm:text-sm py-1 sm:py-2"
                      onClick={() => window.open('https://chat.whatsapp.com/grupoid', '_blank')}
                    >
                      <HeartHandshake className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Entrar no grupo
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="faq" className="mt-10 pt-2">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Perguntas Frequentes</CardTitle>
                    <CardDescription>
                      Respostas para as dúvidas mais comuns dos nossos usuários
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <CircleHelp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base">Como faço para editar uma arte?</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Para editar uma arte, basta clicar no botão "Editar no Canva" ou "Editar no Google Slides" 
                            que aparece na página da arte. Você será redirecionado para a plataforma correspondente 
                            onde poderá personalizar o template.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <CircleHelp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base">Como faço para renovar minha assinatura?</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Sua assinatura é renovada automaticamente através da Hotmart. Caso deseje 
                            gerenciar sua assinatura, acesse o painel da Hotmart com a conta usada para a compra 
                            ou entre em contato com nosso suporte.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <CircleHelp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base">Como posso contribuir com artes para a comunidade?</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Na seção Comunidade, clique no botão "Criar Post" e compartilhe sua arte. 
                            Sua contribuição ficará visível para todos os usuários após revisão da nossa equipe.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <CircleHelp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base">Como funcionam os pontos D.Auto?</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Pontos D.Auto são acumulados por interações com o conteúdo que você compartilha. 
                            Você ganha 5 pontos por arte aprovada, 1 ponto por curtida, e 2 pontos por cada 
                            salvo. Os usuários com mais pontos no final do mês recebem recompensas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="contato" className="mt-10 pt-2">
              <Card>
                <CardHeader>
                  <CardTitle>Formulário de Contato</CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo e entraremos em contato o mais breve possível
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="nome" className="text-xs sm:text-sm font-medium">
                          Nome completo
                        </label>
                        <Input
                          id="nome"
                          name="nome"
                          placeholder="Seu nome"
                          value={formData.nome}
                          onChange={handleInputChange}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                          required
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="email" className="text-xs sm:text-sm font-medium">
                          E-mail
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="text-xs sm:text-sm h-8 sm:h-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="assunto" className="text-xs sm:text-sm font-medium">
                        Assunto
                      </label>
                      <Input
                        id="assunto"
                        name="assunto"
                        placeholder="Assunto da mensagem"
                        value={formData.assunto}
                        onChange={handleInputChange}
                        className="text-xs sm:text-sm h-8 sm:h-10"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="mensagem" className="text-xs sm:text-sm font-medium">
                        Mensagem
                      </label>
                      <Textarea
                        id="mensagem"
                        name="mensagem"
                        placeholder="Descreva sua dúvida ou problema em detalhes"
                        value={formData.mensagem}
                        onChange={handleInputChange}
                        className="text-xs sm:text-sm min-h-[100px] sm:min-h-[120px]"
                        rows={4}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full text-xs sm:text-sm h-9 sm:h-10" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        <>Enviar mensagem</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Seção de compromissos */}
          <div className="mt-10 sm:mt-16 mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">Nosso Compromisso com Você</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex flex-col items-center text-center p-3 sm:p-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Resposta Rápida</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Nos comprometemos a responder todas as mensagens o mais rápido possível, proporcionando um atendimento eficiente.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-3 sm:p-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Suporte Personalizado</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Entendemos que cada caso é único, por isso oferecemos atendimento personalizado para resolver suas necessidades específicas.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-3 sm:p-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Melhoria Contínua</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sua opinião é importante para nós. Utilizamos o feedback dos usuários para melhorar continuamente nossos serviços.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuportePage;