import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LifeBuoy, Mail, MessageCircle, HeartHandshake, Users, CheckCircle2, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Tipos para as abas
type TabType = 'canais' | 'faq' | 'contato';

const SuportePage = () => {
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<TabType>('canais');
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Manipuladores de eventos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envio de formulário
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
          {/* Seção de título */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-3">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Estamos aqui para ajudar você a aproveitar ao máximo o Design Auto. Escolha a opção que melhor atende às suas necessidades.
            </p>
          </div>
          
          {/* Navegação por abas (simplificada) */}
          <div className="mb-8">
            {/* Botões de navegação - Responsivos: Vertical no mobile, Horizontal no desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-6">
              <button 
                onClick={() => handleTabChange('canais')}
                className={`w-full py-3 sm:py-4 rounded-md text-sm sm:text-base font-medium transition-colors ${
                  activeTab === 'canais' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Canais de Atendimento
              </button>
              
              <button 
                onClick={() => handleTabChange('faq')}
                className={`w-full py-3 sm:py-4 rounded-md text-sm sm:text-base font-medium transition-colors ${
                  activeTab === 'faq' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Perguntas Frequentes
              </button>
              
              <button 
                onClick={() => handleTabChange('contato')}
                className={`w-full py-3 sm:py-4 rounded-md text-sm sm:text-base font-medium transition-colors ${
                  activeTab === 'contato' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Formulário de Contato
              </button>
            </div>
            
            {/* Conteúdo das abas */}
            <div className="mt-6">
              {/* Conteúdo: Canais de Atendimento */}
              {activeTab === 'canais' && (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-blue-100 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 space-y-2">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.6 6.32c-1.44-1.52-3.4-2.32-5.55-2.32-4.48 0-8.13 3.75-8.13 8.35 0 1.62.46 3.2 1.33 4.55L4.17 20.8l4.05-1.06c1.28.7 2.7 1.07 4.06 1.07 4.48 0 8.12-3.76 8.12-8.35s-2.14-6.14-2.8-6.14z" />
                        </svg>
                      </div>
                      <CardTitle className="text-lg">WhatsApp</CardTitle>
                      <CardDescription className="text-xs">
                        Atendimento rápido via WhatsApp
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-xs">
                        Horário de atendimento: Segunda à Sexta, das 9h às 18h
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">Tempo de resposta: 1-2h</Badge>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        className="w-full bg-green-500 hover:bg-green-600 text-xs py-1" 
                        onClick={() => window.open('https://wa.me/5527999999999', '_blank')}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Conversar agora
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="border-blue-100 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 space-y-2">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                        <Mail className="h-5 w-5 text-blue-500" />
                      </div>
                      <CardTitle className="text-lg">E-mail</CardTitle>
                      <CardDescription className="text-xs">
                        Suporte por e-mail para dúvidas detalhadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-xs">
                        Envie suas dúvidas para nosso e-mail e nossa equipe responderá em breve.
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">Tempo de resposta: 24-48h</Badge>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full text-xs py-1"
                        onClick={() => window.location.href = 'mailto:suporte@designauto.com.br'}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        suporte@designauto.com.br
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="border-blue-100 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 space-y-2">
                      <div className="w-10 h-10 bg-violet-50 rounded-full flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-violet-500" />
                      </div>
                      <CardTitle className="text-lg">Comunidade</CardTitle>
                      <CardDescription className="text-xs">
                        Grupo de usuários no WhatsApp
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-xs">
                        Participe do nosso grupo e conecte-se com outros usuários do Design Auto.
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">+500 participantes</Badge>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        variant="secondary" 
                        className="w-full text-xs py-1"
                        onClick={() => window.open('https://chat.whatsapp.com/grupoid', '_blank')}
                      >
                        <HeartHandshake className="w-3 h-3 mr-1" />
                        Entrar no grupo
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
              
              {/* Conteúdo: Perguntas Frequentes */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <Card className="p-4">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-lg">Perguntas Frequentes</CardTitle>
                      <CardDescription className="text-xs">
                        Respostas para as dúvidas mais comuns dos nossos usuários
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-0 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CircleHelp className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-sm">Como faço para editar uma arte?</h3>
                            <p className="text-xs text-muted-foreground">
                              Para editar uma arte, basta clicar no botão "Editar no Canva" ou "Editar no Google Slides" 
                              que aparece na página da arte. Você será redirecionado para a plataforma correspondente 
                              onde poderá personalizar o template.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CircleHelp className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-sm">Como faço para renovar minha assinatura?</h3>
                            <p className="text-xs text-muted-foreground">
                              Sua assinatura é renovada automaticamente através da Hotmart. Caso deseje 
                              gerenciar sua assinatura, acesse o painel da Hotmart com a conta usada para a compra 
                              ou entre em contato com nosso suporte.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CircleHelp className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-sm">Como posso contribuir com artes para a comunidade?</h3>
                            <p className="text-xs text-muted-foreground">
                              Na seção Comunidade, clique no botão "Criar Post" e compartilhe sua arte. 
                              Sua contribuição ficará visível para todos os usuários após revisão da nossa equipe.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CircleHelp className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-sm">Como funcionam os pontos D.Auto?</h3>
                            <p className="text-xs text-muted-foreground">
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
              )}
              
              {/* Conteúdo: Formulário de Contato */}
              {activeTab === 'contato' && (
                <Card className="p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-lg">Formulário de Contato</CardTitle>
                    <CardDescription className="text-xs">
                      Preencha o formulário abaixo e entraremos em contato o mais breve possível
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-0 pt-2">
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label htmlFor="nome" className="text-xs font-medium">
                            Nome completo
                          </label>
                          <Input
                            id="nome"
                            name="nome"
                            placeholder="Seu nome"
                            value={formData.nome}
                            onChange={handleInputChange}
                            className="text-xs h-8"
                            required
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label htmlFor="email" className="text-xs font-medium">
                            E-mail
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="text-xs h-8"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label htmlFor="assunto" className="text-xs font-medium">
                          Assunto
                        </label>
                        <Input
                          id="assunto"
                          name="assunto"
                          placeholder="Assunto da mensagem"
                          value={formData.assunto}
                          onChange={handleInputChange}
                          className="text-xs h-8"
                          required
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label htmlFor="mensagem" className="text-xs font-medium">
                          Mensagem
                        </label>
                        <Textarea
                          id="mensagem"
                          name="mensagem"
                          placeholder="Descreva sua dúvida ou problema em detalhes"
                          value={formData.mensagem}
                          onChange={handleInputChange}
                          className="text-xs min-h-[100px]"
                          rows={4}
                          required
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full text-xs h-8" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              )}
            </div>
          </div>
          
          {/* Seção de recursos do suporte */}
          <div className="mt-10">
            <h2 className="text-lg sm:text-xl font-semibold text-center mb-6">
              Nosso Compromisso com o Suporte
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <LifeBuoy className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Resposta Rápida</h3>
                <p className="text-xs text-muted-foreground">
                  Nos comprometemos a responder todas as mensagens o mais rápido possível.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Suporte Personalizado</h3>
                <p className="text-xs text-muted-foreground">
                  Cada caso é único, por isso oferecemos atendimento personalizado.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Melhoria Contínua</h3>
                <p className="text-xs text-muted-foreground">
                  Utilizamos o feedback para melhorar continuamente nossos serviços.
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