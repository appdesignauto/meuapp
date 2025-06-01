import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HandHeart, DollarSign, TrendingUp, Users, CheckCircle } from 'lucide-react';

const affiliateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  company: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  socialMedia: z.string().min(5, 'Informe pelo menos uma rede social'),
  audience: z.string().min(1, 'Selecione o tamanho da sua audiência'),
  niche: z.string().min(10, 'Descreva seu nicho (mínimo 10 caracteres)'),
  experience: z.string().min(1, 'Selecione sua experiência'),
  promotionStrategy: z.string().min(50, 'Descreva sua estratégia (mínimo 50 caracteres)'),
  motivation: z.string().min(30, 'Conte-nos sua motivação (mínimo 30 caracteres)'),
  terms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
});

type AffiliateForm = z.infer<typeof affiliateSchema>;

const Affiliate = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<AffiliateForm>({
    resolver: zodResolver(affiliateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      website: '',
      socialMedia: '',
      audience: '',
      niche: '',
      experience: '',
      promotionStrategy: '',
      motivation: '',
      terms: false,
    },
  });

  const onSubmit = async (data: AffiliateForm) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/affiliate-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company || undefined,
          website: data.website || undefined,
          socialMedia: data.channels,
          audience: data.audience,
          niche: data.niche,
          experience: data.experience,
          promotionStrategy: data.strategy,
          motivation: data.motivation,
          termsAccepted: data.terms
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar solicitação');
      }
      
      setIsSubmitted(true);
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
            <p className="text-gray-600 mb-6">
              Recebemos sua solicitação para se tornar um afiliado. Nossa equipe irá analisar seu perfil e entrar em contato em breve.
            </p>
            <Button onClick={() => setIsSubmitted(false)} className="w-full">
              Enviar Nova Solicitação
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <HandHeart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Programa de Afiliados</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Monetize sua audiência promovendo recursos de design de qualidade e ganhe comissões atrativas.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comissões Atrativas</h3>
            <p className="text-gray-600">Ganhe até 30% de comissão em cada venda realizada através do seu link.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Material de Apoio</h3>
            <p className="text-gray-600">Receba banners, links e conteúdo pronto para suas campanhas.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Users className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Suporte Dedicado</h3>
            <p className="text-gray-600">Nossa equipe está sempre disponível para ajudar no seu sucesso.</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitação de Afiliação</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa/Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da sua empresa ou marca" {...field} />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website/Blog</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="https://seu-site.com"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialMedia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redes Sociais *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="@seuusuario ou links das suas redes"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Instagram, YouTube, TikTok, etc.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho da Audiência *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tamanho" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1k-5k">1.000 - 5.000 seguidores</SelectItem>
                          <SelectItem value="5k-10k">5.000 - 10.000 seguidores</SelectItem>
                          <SelectItem value="10k-50k">10.000 - 50.000 seguidores</SelectItem>
                          <SelectItem value="50k-100k">50.000 - 100.000 seguidores</SelectItem>
                          <SelectItem value="100k+">100.000+ seguidores</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experiência com Afiliados *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sua experiência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="iniciante">Iniciante (primeira vez)</SelectItem>
                          <SelectItem value="basico">Básico (alguns programas)</SelectItem>
                          <SelectItem value="intermediario">Intermediário (vários programas)</SelectItem>
                          <SelectItem value="avancado">Avançado (profissional)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="niche"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nicho/Área de Atuação *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva seu nicho (ex: design gráfico, marketing digital, empreendedorismo...)"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Qual é o foco do seu conteúdo e audiência?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="promotionStrategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estratégia de Promoção *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Como pretende promover nossos produtos? (posts, stories, vídeos, reviews...)"
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Descreva como planeja divulgar nossos recursos (mínimo 50 caracteres)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Por que quer ser nosso afiliado? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Conte-nos sobre sua motivação para se juntar ao nosso programa..."
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
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Aceito os termos e condições do programa de afiliados *
                      </FormLabel>
                      <FormDescription>
                        Ao marcar esta opção, você concorda com nossos termos de afiliação e política de comissões.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Solicitar Afiliação'}
              </Button>
            </form>
          </Form>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-gray-600">
          <p>
            Dúvidas sobre o programa de afiliados? Entre em contato: 
            <a href="mailto:suporte@designauto.com.br" className="text-blue-600 hover:text-blue-800 ml-1">
              suporte@designauto.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Affiliate;